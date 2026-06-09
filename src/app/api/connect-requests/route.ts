import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { getRequestUser } from "@/app/lib/serverAuth";
import {
  buildRequestKey,
  canSendSkillRequest,
  extractProfileSkills,
  hasMatchingSkill,
  mergeUserProfileData,
  normalizeSkillValue,
  pairId,
  toMillis,
} from "@/app/lib/skill-request-utils";

export const dynamic = "force-dynamic";

type CreateSkillRequestBody = {
  receiverId?: string;
  offeredSkill?: string;
  requestedSkill?: string;
  message?: string;
  schedule?: string;
  duration?: string;
};

function parseDuration(value?: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 30;
  return Math.min(Math.max(Math.round(parsed), 15), 240);
}

function rangesOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

async function hasScheduleOverlap(userIds: string[], start: Date, duration: number) {
  const startMs = start.getTime();
  const endMs = startMs + duration * 60 * 1000;
  const [sessionsByUser, pendingRequests] = await Promise.all([
    Promise.all(
      userIds.map((userId) =>
        adminDb.collection("sessions").where("participants", "array-contains", userId).get(),
      ),
    ),
    adminDb
      .collection("skillRequests")
      .where("status", "in", ["pending", "accepted"])
      .get(),
  ]);

  const sessionOverlap = sessionsByUser.some((snap) =>
    snap.docs.some((doc) => {
      const data = doc.data();
      if (["completed", "cancelled", "rejected"].includes(String(data.status || ""))) return false;
      const existingStart = toMillis(data.dateTime || data.meetingDateTime);
      const existingDuration = Number(data.duration) || 30;
      return Boolean(
        existingStart &&
          rangesOverlap(startMs, endMs, existingStart, existingStart + existingDuration * 60 * 1000),
      );
    }),
  );

  if (sessionOverlap) return true;

  return pendingRequests.docs.some((doc) => {
    const data = doc.data();
    const senderId = String(data.senderId || "");
    const receiverId = String(data.receiverId || "");
    if (!userIds.includes(senderId) && !userIds.includes(receiverId)) return false;
    const existingStart = toMillis(data.schedule);
    const existingDuration = Number(data.duration) || 30;
    return Boolean(
      existingStart &&
        rangesOverlap(startMs, endMs, existingStart, existingStart + existingDuration * 60 * 1000),
    );
  });
}

function isRecentPending(createdAt: unknown) {
  const millis = toMillis(createdAt);
  return millis ? Date.now() - millis < 24 * 60 * 60 * 1000 : false;
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getRequestUser(req);
    if (!sessionUser?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CreateSkillRequestBody;
    const senderId = sessionUser.uid.trim();
    const receiverId = body?.receiverId?.trim();
    const offeredSkill = body?.offeredSkill?.trim();
    const requestedSkill = body?.requestedSkill?.trim();
    const message = body?.message?.trim();
    const schedule = body?.schedule?.trim();
    const duration = parseDuration(body?.duration?.trim());

    if (!receiverId || !offeredSkill || !requestedSkill) {
      return NextResponse.json(
        { error: "receiverId, offeredSkill, and requestedSkill are required" },
        { status: 400 },
      );
    }

    if (senderId === receiverId) {
      return NextResponse.json(
        { error: "You cannot send a request to yourself" },
        { status: 400 },
      );
    }

    if (!normalizeSkillValue(offeredSkill) || !normalizeSkillValue(requestedSkill)) {
      return NextResponse.json({ error: "Please choose valid skills" }, { status: 400 });
    }

    if (!schedule) {
      return NextResponse.json({ error: "Please select meeting date and time" }, { status: 400 });
    }

    const scheduleDate = new Date(schedule);
    if (Number.isNaN(scheduleDate.getTime())) {
      return NextResponse.json({ error: "Please select a valid meeting date and time" }, { status: 400 });
    }

    if (scheduleDate.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Meeting cannot be scheduled in the past" }, { status: 400 });
    }

    const [senderProfileSnap, receiverProfileSnap, senderUserSnap, receiverUserSnap, senderInterviewSnap] = await Promise.all([
      adminDb.collection("profiles").doc(senderId).get(),
      adminDb.collection("profiles").doc(receiverId).get(),
      adminDb.collection("users").doc(senderId).get(),
      adminDb.collection("users").doc(receiverId).get(),
      adminDb.collection("interviews").doc(senderId).get(),
    ]);

    const senderProfile = mergeUserProfileData(
      senderUserSnap.exists ? senderUserSnap.data() || {} : null,
      senderProfileSnap.exists ? senderProfileSnap.data() || {} : null,
    );
    const receiverProfile = mergeUserProfileData(
      receiverUserSnap.exists ? receiverUserSnap.data() || {} : null,
      receiverProfileSnap.exists ? receiverProfileSnap.data() || {} : null,
    );
    const senderInterview = senderInterviewSnap.exists ? senderInterviewSnap.data() || {} : null;

    if (!canSendSkillRequest(senderProfile, senderInterview)) {
      return NextResponse.json(
        { error: "Create your profile first (enroll first)." },
        { status: 403 },
      );
    }

    const senderSkills = extractProfileSkills(senderProfile);
    const receiverSkills = extractProfileSkills(receiverProfile);

    if (!hasMatchingSkill(senderSkills.teach, offeredSkill)) {
      return NextResponse.json(
        { error: `You do not appear to offer \"${offeredSkill}\" on your profile.` },
        { status: 400 },
      );
    }

    if (!hasMatchingSkill(receiverSkills.teach, requestedSkill)) {
      return NextResponse.json(
        { error: `The selected skill \"${requestedSkill}\" is not listed as a teaching skill on the provider profile.` },
        { status: 400 },
      );
    }

    const connectionId = pairId(senderId, receiverId);
    const connectionSnap = await adminDb.collection("connections").doc(connectionId).get();
    if (connectionSnap.exists && connectionSnap.data()?.status === "accepted") {
      return NextResponse.json(
        { error: "A connection already exists between these users." },
        { status: 409 },
      );
    }

    const senderRequestsSnap = await adminDb
      .collection("skillRequests")
      .where("senderId", "==", senderId)
      .get();

    if (await hasScheduleOverlap([senderId, receiverId], scheduleDate, duration)) {
      return NextResponse.json(
        { error: "This date/time overlaps with an existing booking." },
        { status: 409 },
      );
    }

    const matchingRequest = senderRequestsSnap.docs.find((doc) => {
      const data = doc.data();
      return (
        data.receiverId === receiverId &&
        normalizeSkillValue(data.offeredSkill) === normalizeSkillValue(offeredSkill) &&
        normalizeSkillValue(data.requestedSkill) === normalizeSkillValue(requestedSkill) &&
        ["pending", "accepted"].includes(String(data.status || "pending"))
      );
    });

    if (matchingRequest) {
      const status = String(matchingRequest.data().status || "pending");
      return NextResponse.json(
        {
          error:
            status === "accepted"
              ? "A request is already accepted for this user."
              : "Request already sent.",
          alreadyRequested: true,
          requestId: matchingRequest.id,
          requestStatus: status,
        },
        { status: 409 },
      );
    }

    const existingPending = senderRequestsSnap.docs.find((doc) => {
      const data = doc.data();
      return (
        data.receiverId === receiverId &&
        data.status === "pending" &&
        normalizeSkillValue(data.offeredSkill) === normalizeSkillValue(offeredSkill) &&
        normalizeSkillValue(data.requestedSkill) === normalizeSkillValue(requestedSkill)
      );
    });
    if (existingPending) {
      return NextResponse.json(
        {
          error: "Request already sent.",
          alreadyRequested: true,
          requestId: existingPending.id,
          requestStatus: "pending",
        },
        { status: 409 },
      );
    }

    const recentPending = senderRequestsSnap.docs.some((doc) => {
      const data = doc.data();
      return data.receiverId === receiverId && data.status === "pending" && isRecentPending(data.createdAt);
    });
    if (recentPending) {
      return NextResponse.json(
        { error: "Please wait before sending another request to the same user." },
        { status: 429 },
      );
    }

    const senderName = (senderProfile.fullName || senderProfile.name || senderProfile.displayName) as
      | string
      | undefined;
    const receiverName = (receiverProfile.fullName || receiverProfile.name || receiverProfile.displayName) as
      | string
      | undefined;
    const requestKey = buildRequestKey(senderId, receiverId, offeredSkill, requestedSkill);
    const requestRef = adminDb.collection("skillRequests").doc();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await requestRef.set({
      senderId,
      receiverId,
      offeredSkill,
      requestedSkill,
      message: message || null,
      schedule: schedule || null,
      meetingDateTime: scheduleDate,
      duration,
      creditsUsed: 1,
      meetingStatus: "pending",
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      senderName: senderName || null,
      receiverName: receiverName || null,
      requestKey,
      connectionId,
      chatEnabled: false,
    });

    await adminDb.collection("notifications").add({
      userId: receiverId,
      type: "skill_request",
      title: "New skill swap request",
      message: senderName
        ? `${senderName} wants to swap ${offeredSkill} for ${requestedSkill}.`
        : `Someone wants to swap ${offeredSkill} for ${requestedSkill}.`,
      senderId,
      fromUserId: senderId,
      senderName: senderName || null,
      fromUserName: senderName || null,
      receiverId,
      toUserId: receiverId,
      receiverName: receiverName || null,
      requestId: requestRef.id,
      connectRequestId: requestRef.id,
      offeredSkill,
      requestedSkill,
      status: "pending",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, requestId: requestRef.id, requestKey });
  } catch (err) {
    console.error("Error creating skill request:", err);
    return NextResponse.json({ error: "Failed to create skill request" }, { status: 500 });
  }
}
