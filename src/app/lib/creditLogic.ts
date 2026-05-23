import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebaseAdmin";
import {
  PAID_CREDIT_PACKS,
  INTERVIEW_PASS_CREDITS,
  SESSION_SCHEDULE_COST,
  SESSION_COMPLETION_BONUS,
} from "@/app/lib/creditConstants";

type CreditTransactionType =
  | "interview_pass"
  | "session_scheduled"
  | "session_cancel_refund"
  | "session_completion_bonus"
  | "paid_credit_purchase";

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
  },
) {
  const awardId = `interview-pass-${userId}`;

  return adminDb.runTransaction(async (transaction) => {
    const awardSnap = await transaction.get(transactionRef(awardId));
    const awardedCredits = interview.result === "Pass" && !awardSnap.exists;
    const completedAt = new Date().toISOString();

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
    const participants = [String(message.senderId || ""), receiverId].filter(Boolean);

    if (!requesterId || !participants.includes(input.actorId)) {
      throw new Error("FORBIDDEN");
    }

    if (input.actorId === requesterId) {
      throw new Error("REQUESTER_CANNOT_ACCEPT_OWN_SCHEDULE");
    }

    if (sessionSnap.exists) {
      return { alreadyScheduled: true, requesterId, deductedCredits: false };
    }

    const userSnap = await transaction.get(userRef(requesterId));
    const credits = readCredits(userSnap.data()?.credits);

    if (!debitSnap.exists && credits < SESSION_SCHEDULE_COST) {
      throw new Error("INSUFFICIENT_CREDITS");
    }

    transaction.update(messageRef, {
      "schedule.status": "accepted",
      "schedule.acceptedBy": input.actorId,
      "schedule.acceptedAt": FieldValue.serverTimestamp(),
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
        acceptedBy: input.actorId,
        topic: schedule.topic || "Skill Swap Meeting",
        dateTime: schedule.dateTime || null,
        duration: schedule.duration || 30,
        notes: schedule.notes || "",
        status: "scheduled",
        creditDeducted: true,
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

    return { alreadyScheduled: false, requesterId, deductedCredits: !debitSnap.exists };
  });
}

export async function updateSessionStatusWithCredits(input: {
  sessionId: string;
  actorId: string;
  status: "completed" | "cancelled";
  rewardBonusCredit?: boolean;
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
    if (currentStatus !== "scheduled") {
      return { alreadyHandled: true, status: currentStatus, creditsDelta: 0 };
    }

    const requesterId = String(session.requesterId || session.requestedBy || "");
    if (!requesterId) {
      throw new Error("SESSION_REQUESTER_MISSING");
    }

    const refundId = `session-cancel-refund-${input.sessionId}`;
    const bonusId = `session-completion-bonus-${input.sessionId}`;
    const [refundSnap, bonusSnap] = await Promise.all([
      input.status === "cancelled" && session.creditDeducted && !session.creditRefunded
        ? transaction.get(transactionRef(refundId))
        : Promise.resolve(null),
      input.status === "completed" &&
      input.rewardBonusCredit !== false &&
      !session.completionBonusAwarded
        ? transaction.get(transactionRef(bonusId))
        : Promise.resolve(null),
    ]);

    let creditsDelta = 0;
    const nowField = input.status === "completed" ? "completedAt" : "cancelledAt";
    const chatId = String(session.chatId || "");
    const scheduleMessageId = String(session.scheduleMessageId || "");
    const messageRef =
      chatId && scheduleMessageId
        ? adminDb.collection("chatRooms").doc(chatId).collection("messages").doc(scheduleMessageId)
        : null;
    const topic = String(session.topic || "Skill Swap Meeting");

    transaction.update(sessionRef, {
      status: input.status,
      [nowField]: FieldValue.serverTimestamp(),
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

    if (input.status === "cancelled" && session.creditDeducted && !session.creditRefunded) {
      if (!refundSnap?.exists) {
        applyCreditDelta(transaction, requesterId, SESSION_SCHEDULE_COST);
        writeCreditTransaction(
          transaction,
          refundId,
          requesterId,
          SESSION_SCHEDULE_COST,
          "session_cancel_refund",
          { sessionId: input.sessionId },
        );
        transaction.update(sessionRef, { creditRefunded: true });
        creditsDelta += SESSION_SCHEDULE_COST;
      }
    }

    if (
      input.status === "completed" &&
      input.rewardBonusCredit !== false &&
      !session.completionBonusAwarded
    ) {
      if (!bonusSnap?.exists) {
        applyCreditDelta(transaction, requesterId, SESSION_COMPLETION_BONUS);
        writeCreditTransaction(
          transaction,
          bonusId,
          requesterId,
          SESSION_COMPLETION_BONUS,
          "session_completion_bonus",
          { sessionId: input.sessionId },
        );
        transaction.update(sessionRef, { completionBonusAwarded: true });
        creditsDelta += SESSION_COMPLETION_BONUS;
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
    const purchaseSnap = await transaction
      .collection("creditPurchases")
      .where("stripeSessionId", "==", input.stripeSessionId)
      .get();

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
