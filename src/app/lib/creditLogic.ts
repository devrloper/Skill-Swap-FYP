import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebaseAdmin";
import {
  PAID_CREDIT_PACKS,
  INTERVIEW_PASS_CREDITS,
  SESSION_SCHEDULE_COST,
} from "@/app/lib/creditConstants";
import { createZoomMeeting } from "@/app/lib/zoom";

type CreditTransactionType =
  | "interview_pass"
  | "session_scheduled"
  | "session_cancel_refund"
  | "paid_credit_purchase";

type SessionStatus =
  | "pending"
  | "accepted"
  | "scheduled"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "rejected";

function transactionRef(id: string) {
  return adminDb.collection("creditTransactions").doc(id);
}

function userRef(userId: string) {
  return adminDb.collection("users").doc(userId);
}

function profileRef(userId: string) {
  return adminDb.collection("profiles").doc(userId);
}

function readCredits(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toDate(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

function minutesFrom(value: unknown, fallback = 30) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), 15), 240);
}

function rangesOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

async function hasOverlappingSession(userIds: string[], start: Date, duration: number, ignoreSessionId?: string) {
  const end = start.getTime() + duration * 60 * 1000;
  const snapshots = await Promise.all(
    userIds.map((userId) =>
      adminDb.collection("sessions").where("participants", "array-contains", userId).get(),
    ),
  );

  return snapshots.some((snapshot) =>
    snapshot.docs.some((doc) => {
      if (doc.id === ignoreSessionId) return false;
      const data = doc.data();
      if (["completed", "cancelled", "rejected"].includes(String(data.status || ""))) return false;
      const existingStart = toDate(data.dateTime || data.meetingDateTime);
      if (!existingStart) return false;
      const existingDuration = minutesFrom(data.duration, 30);
      return rangesOverlap(
        start.getTime(),
        end,
        existingStart.getTime(),
        existingStart.getTime() + existingDuration * 60 * 1000,
      );
    }),
  );
}

function applyCreditDelta(
  transaction: FirebaseFirestore.Transaction,
  userId: string,
  delta: number,
) {
  const update = {
    credits: FieldValue.increment(delta),
    updatedAt: FieldValue.serverTimestamp(),
  };

  transaction.set(userRef(userId), update, { merge: true });
  transaction.set(profileRef(userId), update, { merge: true });
}

function writeCreditTransaction(
  transaction: FirebaseFirestore.Transaction,
  id: string,
  userId: string,
  delta: number,
  type: CreditTransactionType,
  metadata: Record<string, unknown> = {},
) {
  transaction.set(transactionRef(id), {
    id,
    userId,
    delta,
    type,
    metadata,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function saveInterviewResultAndAwardCredits(
  userId: string,
  interview: {
    result: "Pass" | "Fail";
    score: number;
    correct: number;
    total: number;
    wrongAnswers: unknown[];
    forcedFailReason?: string;
  },
) {
  const awardId = `interview-pass-${userId}`;

  return adminDb.runTransaction(async (transaction) => {
    const awardSnap = await transaction.get(transactionRef(awardId));
    const awardedCredits = interview.result === "Pass" && !awardSnap.exists;
    const completedAt = new Date().toISOString();
    const failMetadata =
      interview.result === "Fail"
        ? {
            lastFailedAt: completedAt,
            ...(interview.forcedFailReason
              ? { forcedFailReason: interview.forcedFailReason }
              : {}),
          }
        : {};

    transaction.set(
      profileRef(userId),
      {
        enrolled: true,
        profileCompleted: true,
        enrolledAt: FieldValue.serverTimestamp(),
        interviewStatus: interview.result,
        interviewScore: interview.score,
        ...(interview.result === "Pass" ? { interviewCreditAwarded: true } : {}),
        interview: {
          result: interview.result,
          score: interview.score,
          correct: interview.correct,
          total: interview.total,
          wrongAnswers: interview.wrongAnswers,
          ...failMetadata,
          completedAt,
        },
      },
      { merge: true },
    );

    transaction.set(
      adminDb.collection("interviews").doc(userId),
      {
        userId,
        result: interview.result,
        score: interview.score,
        correct: interview.correct,
        total: interview.total,
        wrongAnswers: interview.wrongAnswers,
        ...failMetadata,
        completedAt,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    if (awardedCredits) {
      applyCreditDelta(transaction, userId, INTERVIEW_PASS_CREDITS);
      writeCreditTransaction(
        transaction,
        awardId,
        userId,
        INTERVIEW_PASS_CREDITS,
        "interview_pass",
        { result: interview.result, score: interview.score },
      );
    }

    return { awardedCredits, creditsDelta: awardedCredits ? INTERVIEW_PASS_CREDITS : 0 };
  });
}

export async function syncPassedInterviewCredits(userId: string) {
  const awardId = `interview-pass-${userId}`;

  return adminDb.runTransaction(async (transaction) => {
    const awardSnap = await transaction.get(transactionRef(awardId));
    if (awardSnap.exists) {
      return { awardedCredits: false, creditsDelta: 0 };
    }

    const [profileSnap, interviewSnap] = await Promise.all([
      transaction.get(profileRef(userId)),
      transaction.get(adminDb.collection("interviews").doc(userId)),
    ]);

    const profile = profileSnap.data() || {};
    const interview = interviewSnap.data() || {};
    const passed =
      String(profile.interviewStatus || profile.interview?.result || interview.result || "")
        .trim()
        .toLowerCase() === "pass";

    if (!passed) {
      return { awardedCredits: false, creditsDelta: 0 };
    }

    applyCreditDelta(transaction, userId, INTERVIEW_PASS_CREDITS);
    writeCreditTransaction(
      transaction,
      awardId,
      userId,
      INTERVIEW_PASS_CREDITS,
      "interview_pass",
      { synced: true },
    );
    transaction.set(profileRef(userId), { interviewCreditAwarded: true }, { merge: true });

    return { awardedCredits: true, creditsDelta: INTERVIEW_PASS_CREDITS };
  });
}

export async function scheduleSessionWithCreditDebit(input: {
  sessionId: string;
  chatId: string;
  scheduleMessageId: string;
  actorId: string;
}) {
  const scheduleTransactionId = `session-scheduled-${input.sessionId}`;

  return adminDb.runTransaction(async (transaction) => {
    const messageRef = adminDb
      .collection("chatRooms")
      .doc(input.chatId)
      .collection("messages")
      .doc(input.scheduleMessageId);
    const sessionRef = adminDb.collection("sessions").doc(input.sessionId);

    const [messageSnap, sessionSnap, debitSnap] = await Promise.all([
      transaction.get(messageRef),
      transaction.get(sessionRef),
      transaction.get(transactionRef(scheduleTransactionId)),
    ]);

    if (!messageSnap.exists) {
      throw new Error("SCHEDULE_MESSAGE_NOT_FOUND");
    }

    const message = messageSnap.data() || {};
    const schedule = (message.schedule || {}) as Record<string, unknown>;
    const requesterId = String(schedule.proposedBy || message.senderId || "");
    const receiverId = String(message.receiverId || "");
    const providerId = input.actorId;
    const learnerId = requesterId;
    const participants = [String(message.senderId || ""), receiverId].filter(Boolean);
    const dateTime = toDate(schedule.dateTime);
    const duration = minutesFrom(schedule.duration, 30);

    if (!requesterId || !participants.includes(input.actorId)) {
      throw new Error("FORBIDDEN");
    }

    if (input.actorId === requesterId) {
      throw new Error("REQUESTER_CANNOT_ACCEPT_OWN_SCHEDULE");
    }

    if (sessionSnap.exists) {
      return { alreadyScheduled: true, requesterId, deductedCredits: false };
    }

    if (!dateTime || dateTime.getTime() <= Date.now()) {
      throw new Error("INVALID_MEETING_TIME");
    }

    if (await hasOverlappingSession(participants, dateTime, duration, input.sessionId)) {
      throw new Error("OVERLAPPING_SESSION");
    }

    const userSnap = await transaction.get(userRef(requesterId));
    const credits = readCredits(userSnap.data()?.credits);

    if (!debitSnap.exists && credits < SESSION_SCHEDULE_COST) {
      throw new Error("INSUFFICIENT_CREDITS");
    }

    const zoomMeeting = await createZoomMeeting({
      topic: String(schedule.topic || "Skill Swap Meeting"),
      startTime: dateTime,
      duration,
      agenda: String(schedule.notes || ""),
    });

    transaction.update(messageRef, {
      "schedule.status": "accepted",
      "schedule.acceptedBy": input.actorId,
      "schedule.acceptedAt": FieldValue.serverTimestamp(),
      "schedule.zoomMeetingId": zoomMeeting.zoomMeetingId,
      "schedule.joinUrl": zoomMeeting.joinUrl,
      "schedule.startUrl": zoomMeeting.startUrl,
      text: `Meeting confirmed: ${schedule.topic || "Skill Swap Meeting"}`,
    });

    transaction.set(
      sessionRef,
      {
        id: input.sessionId,
        chatId: input.chatId,
        scheduleMessageId: input.scheduleMessageId,
        participants,
        requesterId,
        learnerId,
        providerId,
        acceptedBy: input.actorId,
        topic: schedule.topic || "Skill Swap Meeting",
        dateTime,
        meetingDateTime: dateTime,
        duration,
        notes: schedule.notes || "",
        zoomMeetingId: zoomMeeting.zoomMeetingId,
        joinUrl: zoomMeeting.joinUrl,
        startUrl: zoomMeeting.startUrl,
        status: "scheduled",
        attendanceStatus: {
          learner: "pending",
          provider: "pending",
        },
        creditDeducted: true,
        creditsUsed: SESSION_SCHEDULE_COST,
        creditRefunded: false,
        completionBonusAwarded: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    if (!debitSnap.exists) {
      applyCreditDelta(transaction, requesterId, -SESSION_SCHEDULE_COST);
      writeCreditTransaction(
        transaction,
        scheduleTransactionId,
        requesterId,
        -SESSION_SCHEDULE_COST,
        "session_scheduled",
        { sessionId: input.sessionId, chatId: input.chatId },
      );
    }

    return {
      alreadyScheduled: false,
      requesterId,
      deductedCredits: !debitSnap.exists,
      zoomMeeting,
    };
  });
}

export async function scheduleAcceptedRequestWithZoom(input: {
  sessionId: string;
  requestId: string;
  learnerId: string;
  providerId: string;
  skillId?: string | null;
  topic?: string | null;
  dateTime: string | Date;
  duration: number | string;
  message?: string | null;
}) {
  const start = toDate(input.dateTime);
  const duration = minutesFrom(input.duration, 30);
  const participants = [input.learnerId, input.providerId].filter(Boolean);
  const transactionId = `session-scheduled-${input.sessionId}`;

  if (!start || start.getTime() <= Date.now()) {
    throw new Error("INVALID_MEETING_TIME");
  }

  if (await hasOverlappingSession(participants, start, duration, input.sessionId)) {
    throw new Error("OVERLAPPING_SESSION");
  }

  const existingDebit = await transactionRef(transactionId).get();
  if (!existingDebit.exists) {
    const learnerSnap = await userRef(input.learnerId).get();
    if (readCredits(learnerSnap.data()?.credits) < SESSION_SCHEDULE_COST) {
      throw new Error("INSUFFICIENT_CREDITS");
    }
  }

  const zoomMeeting = await createZoomMeeting({
    topic: input.topic || "Skill Swap Meeting",
    startTime: start,
    duration,
    agenda: input.message || input.topic || "Skill Swap Meeting",
  });

  return adminDb.runTransaction(async (transaction) => {
    const sessionRef = adminDb.collection("sessions").doc(input.sessionId);
    const sessionSnap = await transaction.get(sessionRef);
    const debitSnap = await transaction.get(transactionRef(transactionId));

    if (sessionSnap.exists) {
      return { alreadyScheduled: true, deductedCredits: false, zoomMeeting };
    }

    const learnerSnap = await transaction.get(userRef(input.learnerId));
    const credits = readCredits(learnerSnap.data()?.credits);
    if (!debitSnap.exists && credits < SESSION_SCHEDULE_COST) {
      throw new Error("INSUFFICIENT_CREDITS");
    }

    transaction.set(
      sessionRef,
      {
        id: input.sessionId,
        requestId: input.requestId,
        learnerId: input.learnerId,
        providerId: input.providerId,
        participants,
        requesterId: input.learnerId,
        acceptedBy: input.providerId,
        skillId: input.skillId || null,
        topic: input.topic || "Skill Swap Meeting",
        dateTime: start,
        meetingDateTime: start,
        duration,
        notes: input.message || "",
        zoomMeetingId: zoomMeeting.zoomMeetingId,
        joinUrl: zoomMeeting.joinUrl,
        startUrl: zoomMeeting.startUrl,
        status: "scheduled" as SessionStatus,
        meetingStatus: "scheduled",
        attendanceStatus: {
          learner: "pending",
          provider: "pending",
        },
        creditsUsed: SESSION_SCHEDULE_COST,
        creditDeducted: true,
        creditRefunded: false,
        completionBonusAwarded: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    if (!debitSnap.exists) {
      applyCreditDelta(transaction, input.learnerId, -SESSION_SCHEDULE_COST);
      writeCreditTransaction(
        transaction,
        transactionId,
        input.learnerId,
        -SESSION_SCHEDULE_COST,
        "session_scheduled",
        { sessionId: input.sessionId, requestId: input.requestId },
      );
    }

    return { alreadyScheduled: false, deductedCredits: !debitSnap.exists, zoomMeeting };
  });
}

export async function updateSessionStatusWithCredits(input: {
  sessionId: string;
  actorId: string;
  status: "completed" | "cancelled";
  cancellationReason?: string;
  refundRatio?: number;
}) {
  return adminDb.runTransaction(async (transaction) => {
    const sessionRef = adminDb.collection("sessions").doc(input.sessionId);
    const sessionSnap = await transaction.get(sessionRef);

    if (!sessionSnap.exists) {
      throw new Error("SESSION_NOT_FOUND");
    }

    const session = sessionSnap.data() || {};
    const participants = Array.isArray(session.participants)
      ? session.participants.map(String)
      : [];

    if (!participants.includes(input.actorId)) {
      throw new Error("FORBIDDEN");
    }

    const currentStatus = String(session.status || "scheduled");
    if (!["scheduled", "ongoing"].includes(currentStatus)) {
      return { alreadyHandled: true, status: currentStatus, creditsDelta: 0 };
    }

    const requesterId = String(session.requesterId || session.learnerId || session.requestedBy || "");
    if (!requesterId) {
      throw new Error("SESSION_REQUESTER_MISSING");
    }

    const refundId = `session-cancel-refund-${input.sessionId}`;
    const refundSnap =
      input.status === "cancelled" && session.creditDeducted && !session.creditRefunded
        ? await transaction.get(transactionRef(refundId))
        : null;

    let creditsDelta = 0;
    const nowField = input.status === "completed" ? "completedAt" : "cancelledAt";
    const chatId = String(session.chatId || "");
    const scheduleMessageId = String(session.scheduleMessageId || "");
    const messageRef =
      chatId && scheduleMessageId
        ? adminDb.collection("chatRooms").doc(chatId).collection("messages").doc(scheduleMessageId)
        : null;
    const topic = String(session.topic || "Skill Swap Meeting");

    const refundRatio =
      typeof input.refundRatio === "number" && Number.isFinite(input.refundRatio)
        ? Math.min(Math.max(input.refundRatio, 0), 1)
        : 1;
    const refundCredits = refundRatio >= 1 ? SESSION_SCHEDULE_COST : 0;

    transaction.update(sessionRef, {
      status: input.status,
      meetingStatus: input.status,
      [nowField]: FieldValue.serverTimestamp(),
      ...(input.status === "cancelled"
        ? { cancellationReason: input.cancellationReason || null, cancelledBy: input.actorId }
        : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (messageRef) {
      transaction.update(messageRef, {
        "schedule.status": input.status,
        text:
          input.status === "completed"
            ? `Meeting completed: ${topic}`
            : `Meeting cancelled: ${topic}`,
      });
    }

    if (input.status === "cancelled" && session.creditDeducted && !session.creditRefunded && refundCredits > 0) {
      if (!refundSnap?.exists) {
        applyCreditDelta(transaction, requesterId, refundCredits);
        writeCreditTransaction(
          transaction,
          refundId,
          requesterId,
          refundCredits,
          "session_cancel_refund",
          { sessionId: input.sessionId, refundRatio },
        );
        transaction.update(sessionRef, { creditRefunded: true });
        creditsDelta += refundCredits;
      }
    }

    return { alreadyHandled: false, status: input.status, creditsDelta };
  });
}

export async function purchasePaidCredits(input: {
  userId: string;
  packId: keyof typeof PAID_CREDIT_PACKS;
}) {
  const pack = PAID_CREDIT_PACKS[input.packId];
  const purchaseRef = adminDb.collection("creditPurchases").doc();
  const transactionId = `paid-credit-purchase-${purchaseRef.id}`;

  return adminDb.runTransaction(async (transaction) => {
    transaction.set(purchaseRef, {
      id: purchaseRef.id,
      userId: input.userId,
      packId: input.packId,
      label: pack.label,
      credits: pack.credits,
      amount: pack.price,
      currency: "PKR",
      status: "paid",
      createdAt: FieldValue.serverTimestamp(),
    });

    applyCreditDelta(transaction, input.userId, pack.credits);
    writeCreditTransaction(
      transaction,
      transactionId,
      input.userId,
      pack.credits,
      "paid_credit_purchase",
      {
        purchaseId: purchaseRef.id,
        packId: input.packId,
        amount: pack.price,
        currency: "PKR",
      },
    );

    return {
      purchaseId: purchaseRef.id,
      creditsDelta: pack.credits,
      pack,
    };
  });
}

export async function createStripePendingPurchase(input: {
  userId: string;
  packId: keyof typeof PAID_CREDIT_PACKS;
  stripeSessionId: string;
  amount: number; // amount in USD (cents)
}) {
  const pack = PAID_CREDIT_PACKS[input.packId];
  const purchaseRef = adminDb.collection("creditPurchases").doc();

  return adminDb.runTransaction(async (transaction) => {
    transaction.set(purchaseRef, {
      id: purchaseRef.id,
      userId: input.userId,
      packId: input.packId,
      label: pack.label,
      credits: pack.credits,
      amount: input.amount,
      currency: "USD",
      status: "pending",
      stripeSessionId: input.stripeSessionId,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      purchaseId: purchaseRef.id,
      stripeSessionId: input.stripeSessionId,
    };
  });
}

export async function confirmStripePaidCredits(input: {
  stripeSessionId: string;
  userId: string;
  packId: keyof typeof PAID_CREDIT_PACKS;
}) {
  const pack = PAID_CREDIT_PACKS[input.packId];
  const transactionId = `paid-credit-purchase-stripe-${input.stripeSessionId}`;

  return adminDb.runTransaction(async (transaction) => {
    // Find and update the pending purchase
    const purchaseSnap = await transaction.get(
      adminDb
      .collection("creditPurchases")
      .where("stripeSessionId", "==", input.stripeSessionId)
    );

    if (purchaseSnap.empty) {
      throw new Error("Purchase record not found");
    }

    const purchaseDoc = purchaseSnap.docs[0];
    const purchaseId = purchaseDoc.id;

    // Update purchase status to paid
    transaction.update(purchaseDoc.ref, {
      status: "paid",
      paidAt: FieldValue.serverTimestamp(),
    });

    // Award credits to user
    applyCreditDelta(transaction, input.userId, pack.credits);
    
    // Record transaction
    writeCreditTransaction(
      transaction,
      transactionId,
      input.userId,
      pack.credits,
      "paid_credit_purchase",
      {
        purchaseId: purchaseId,
        packId: input.packId,
        stripeSessionId: input.stripeSessionId,
        currency: "USD",
      },
    );

    return {
      purchaseId: purchaseId,
      creditsDelta: pack.credits,
      pack,
    };
  });
}

// Re-export constants for backward compatibility
export { PAID_CREDIT_PACKS, INTERVIEW_PASS_CREDITS, SESSION_SCHEDULE_COST, SESSION_COMPLETION_BONUS } from "@/app/lib/creditConstants";
