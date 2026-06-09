import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getRequestUser } from "@/app/lib/serverAuth";
import { adminDb } from "@/app/lib/firebaseAdmin";
import {
  scheduleSessionWithCreditDebit,
  updateSessionStatusWithCredits,
} from "@/app/lib/creditLogic";
import { pairId, toMillis } from "@/app/lib/skill-request-utils";

export const dynamic = "force-dynamic";

type ScheduleSessionBody = {
  peerId?: string;
  chatId?: string;
  scheduleMessageId?: string;
};

type UpdateSessionBody = {
  sessionId?: string;
  status?: "completed" | "cancelled";
  action?: "complete" | "cancel";
  rewardBonusCredit?: boolean;
  cancellationReason?: string;
  refundRatio?: number;
};

function sessionParticipants(data: Record<string, unknown>) {
  if (Array.isArray(data.participants)) return data.participants.map(String).filter(Boolean);
  return [data.learnerId, data.providerId, data.requesterId, data.acceptedBy]
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .map((value) => value.trim());
}

function cancellationRefundRatio(data: Record<string, unknown>, actorId: string) {
  const providerId = String(data.providerId || data.acceptedBy || "");
  if (actorId === providerId) return 1;

  const start = toMillis(data.dateTime || data.meetingDateTime);
  if (!start) return 0;
  const hoursBeforeMeeting = (start - Date.now()) / (60 * 60 * 1000);
  if (hoursBeforeMeeting >= 24) return 1;
  if (hoursBeforeMeeting >= 2) return 0.5;
  return 0;
}

async function writeSessionNotifications(input: {
  session: Record<string, unknown>;
  actorId: string;
  sessionId: string;
  status: "completed" | "cancelled";
}) {
  const title = input.status === "completed" ? "Meeting completed" : "Meeting cancelled";
  const topic = String(input.session.topic || "Skill Swap Meeting");
  const participants = sessionParticipants(input.session);

  await Promise.all(
    participants.map((userId) =>
      adminDb.collection("notifications").add({
        userId,
        type: input.status === "completed" ? "meeting_completed" : "meeting_cancelled",
        title,
        message:
          input.status === "completed"
            ? `${topic} has been marked completed.`
            : `${topic} has been cancelled.`,
        senderId: input.actorId,
        sessionId: input.sessionId,
        status: input.status,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      }),
    ),
  );
}

function visibleSession(data: Record<string, unknown>, actorId: string) {
  const providerId = String(data.providerId || data.acceptedBy || "");
  const isProvider = actorId === providerId;
  const now = Date.now();
  const start = toMillis(data.dateTime || data.meetingDateTime);
  const duration =
    typeof data.duration === "number" && Number.isFinite(data.duration)
      ? data.duration
      : Number(data.duration) || 30;
  const end = start ? start + duration * 60 * 1000 : 0;
  const status = String(data.status || "scheduled");
  const canOpenMeeting =
    start > 0 &&
    now >= start - 5 * 60 * 1000 &&
    now <= end &&
    ["scheduled", "ongoing"].includes(status);

  return {
    ...data,
    joinUrl: !isProvider ? data.joinUrl || null : data.joinUrl || null,
    startUrl: isProvider ? data.startUrl || null : null,
    canOpenMeeting,
    meetingStartsInMs: start ? Math.max(start - now, 0) : null,
    expired: end ? now > end : false,
  };
}

async function completeExpiredSessions(userId: string) {
  const snap = await adminDb.collection("sessions").where("participants", "array-contains", userId).get();
  const batch = adminDb.batch();
  let changed = 0;
  const now = Date.now();

  snap.docs.forEach((doc) => {
    const data = doc.data();
    const status = String(data.status || "scheduled");
    if (!["scheduled", "ongoing"].includes(status)) return;
    const start = toMillis(data.dateTime || data.meetingDateTime);
    const duration = typeof data.duration === "number" ? data.duration : Number(data.duration) || 30;
    const end = start ? start + duration * 60 * 1000 : 0;
    if (start && status === "scheduled" && now >= start && now <= end) {
      batch.update(doc.ref, {
        status: "ongoing",
        meetingStatus: "ongoing",
        updatedAt: FieldValue.serverTimestamp(),
      });
      changed += 1;
      return;
    }
    if (start && now > end) {
      batch.update(doc.ref, {
        status: "completed",
        meetingStatus: "completed",
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      changed += 1;
    }
  });

  if (changed) await batch.commit();
}

async function createDueMeetingReminders(userId: string) {
  const snap = await adminDb.collection("sessions").where("participants", "array-contains", userId).get();
  const now = Date.now();

  await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data();
      if (!["scheduled", "ongoing"].includes(String(data.status || "scheduled"))) return;
      const start = toMillis(data.dateTime || data.meetingDateTime);
      if (!start || start < now || start - now > 15 * 60 * 1000) return;

      const reminderRef = adminDb.collection("notifications").doc(`meeting-reminder-${doc.id}-${userId}`);
      const reminderSnap = await reminderRef.get();
      if (reminderSnap.exists) return;

      await reminderRef.set({
        userId,
        type: "meeting_reminder",
        title: "Meeting reminder",
        message: `${String(data.topic || "Skill Swap Meeting")} starts soon.`,
        sessionId: doc.id,
        status: "scheduled",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }),
  );
}

function creditErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  switch (message) {
    case "INSUFFICIENT_CREDITS":
      return NextResponse.json(
        { error: "The requester needs at least 1 credit to schedule this meeting." },
        { status: 402 },
      );
    case "FORBIDDEN":
    case "REQUESTER_CANNOT_ACCEPT_OWN_SCHEDULE":
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    case "SCHEDULE_MESSAGE_NOT_FOUND":
    case "SESSION_NOT_FOUND":
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    case "INVALID_MEETING_TIME":
      return NextResponse.json({ error: "Please schedule a future meeting time." }, { status: 400 });
    case "OVERLAPPING_SESSION":
      return NextResponse.json({ error: "This schedule overlaps with an existing session." }, { status: 409 });
    case "ZOOM_CONFIG_MISSING":
      return NextResponse.json({ error: "Zoom API credentials are not configured." }, { status: 500 });
    case "ZOOM_AUTH_FAILED":
      return NextResponse.json(
        { error: "Zoom authentication failed. Please update the Zoom account ID, client ID, and client secret." },
        { status: 502 },
      );
    case "ZOOM_MEETING_FAILED":
      return NextResponse.json({ error: "Zoom meeting could not be created." }, { status: 502 });
    default:
      console.error("Session credit error:", error);
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const sessionUser = await getRequestUser(req);
    if (!sessionUser?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actorId = sessionUser.uid.trim();
    await completeExpiredSessions(actorId);
    await createDueMeetingReminders(actorId);

    const snap = await adminDb.collection("sessions").where("participants", "array-contains", actorId).get();
    const sessions = snap.docs
      .map((doc) => ({ id: doc.id, ...visibleSession(doc.data(), actorId) }) as Record<string, unknown>)
      .sort(
        (a, b) =>
          toMillis(a.dateTime || a.meetingDateTime) -
          toMillis(b.dateTime || b.meetingDateTime),
      );

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error loading sessions:", error);
    return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getRequestUser(req);
    if (!sessionUser?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ScheduleSessionBody;
    const actorId = sessionUser.uid.trim();
    const peerId = body.peerId?.trim();
    const scheduleMessageId = body.scheduleMessageId?.trim();
    const chatId = body.chatId?.trim() || (peerId ? pairId(actorId, peerId) : "");

    if (!chatId || !scheduleMessageId) {
      return NextResponse.json(
        { error: "chatId and scheduleMessageId are required" },
        { status: 400 },
      );
    }

    const sessionId = `${chatId}_${scheduleMessageId}`;
    const result = await scheduleSessionWithCreditDebit({
      sessionId,
      chatId,
      scheduleMessageId,
      actorId,
    });

    return NextResponse.json({ ok: true, sessionId, ...result });
  } catch (error) {
    return creditErrorResponse(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const sessionUser = await getRequestUser(req);
    if (!sessionUser?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as UpdateSessionBody;
    const sessionId = body.sessionId?.trim();
    const status =
      body.status || (body.action === "complete" ? "completed" : body.action === "cancel" ? "cancelled" : null);

    if (!sessionId || (status !== "completed" && status !== "cancelled")) {
      return NextResponse.json(
        { error: "sessionId and a completed/cancelled status are required" },
        { status: 400 },
      );
    }

    const sessionSnap = await adminDb.collection("sessions").doc(sessionId).get();
    const sessionData = sessionSnap.exists ? sessionSnap.data() || {} : {};
    const actorId = sessionUser.uid.trim();
    const refundRatio =
      status === "cancelled"
        ? body.refundRatio ?? cancellationRefundRatio(sessionData, actorId)
        : body.refundRatio;

    const result = await updateSessionStatusWithCredits({
      sessionId,
      actorId,
      status,
      rewardBonusCredit: body.rewardBonusCredit,
      cancellationReason: body.cancellationReason,
      refundRatio,
    });

    if (!result.alreadyHandled && Object.keys(sessionData).length) {
      await writeSessionNotifications({ session: sessionData, actorId, sessionId, status });
    }

    return NextResponse.json({ ok: true, sessionId, ...result });
  } catch (error) {
    return creditErrorResponse(error);
  }
}
