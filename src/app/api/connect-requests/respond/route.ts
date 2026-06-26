import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { getRequestUser } from "@/app/lib/serverAuth";
import { pairId, toMillis } from "@/app/lib/skill-request-utils";
import { scheduleAcceptedRequestWithZoom } from "@/app/lib/creditLogic";

export const dynamic = "force-dynamic";

type RespondBody = {
  requestId?: string;
  senderId?: string;
  receiverId?: string;
  fromUserId?: string;
  toUserId?: string;
  action?: "accept" | "reject" | "cancel";
  cancellationReason?: string;
};

function isPendingExpired(createdAt: unknown, expiresAt: unknown) {
  const expiry = toMillis(expiresAt);
  if (expiry) return expiry < Date.now();
  const created = toMillis(createdAt);
  return created ? Date.now() - created > 7 * 24 * 60 * 60 * 1000 : false;
}

async function createConnectionArtifacts(connectionId: string, senderId: string, receiverId: string, request: Record<string, unknown>) {
  await adminDb.collection("connections").doc(connectionId).set(
    {
      id: connectionId,
      users: [senderId, receiverId],
      status: "accepted",
      requestedBy: senderId,
      requestId: request.id || null,
      senderId,
      receiverId,
      senderName: request.senderName || null,
      receiverName: request.receiverName || null,
      offeredSkill: request.offeredSkill || null,
      requestedSkill: request.requestedSkill || null,
      chatEnabled: true,
      createdAt: request.createdAt || FieldValue.serverTimestamp(),
      acceptedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await Promise.all([
    adminDb.collection("chatRooms").doc(connectionId).set(
      {
        connectionId,
        participants: [senderId, receiverId],
        requestId: request.id || null,
        chatEnabled: true,
        createdAt: request.createdAt || FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    ),
    adminDb.collection("users").doc(senderId).collection("chats").doc(connectionId).set(
      {
        chatId: connectionId,
        peerId: receiverId,
        connectionId,
        title: request.receiverName || "Skill Swap Chat",
        chatEnabled: true,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: request.createdAt || FieldValue.serverTimestamp(),
      },
      { merge: true },
    ),
    adminDb.collection("users").doc(receiverId).collection("chats").doc(connectionId).set(
      {
        chatId: connectionId,
        peerId: senderId,
        connectionId,
        title: request.senderName || "Skill Swap Chat",
        chatEnabled: true,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: request.createdAt || FieldValue.serverTimestamp(),
      },
      { merge: true },
    ),
  ]);
}

async function markRequestNotificationsHandled(
  requestId: string,
  receiverId: string,
  status: string,
) {
  const snap = await adminDb
    .collection("notifications")
    .where("requestId", "==", requestId)
    .where("userId", "==", receiverId)
    .get();

  if (snap.empty) return;

  const batch = adminDb.batch();
  snap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      status,
      read: true,
      handledAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function PATCH(req: Request) {
  try {
    const sessionUser = await getRequestUser(req);
    if (!sessionUser?.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as RespondBody;
    const requestId = body?.requestId?.trim();
    const senderId = body?.senderId?.trim() || body?.fromUserId?.trim();
    const receiverId = body?.receiverId?.trim() || body?.toUserId?.trim();
    const action = body?.action;
    const actorId = sessionUser.uid.trim();

    if (!action || !["accept", "reject", "cancel"].includes(action)) {
      return NextResponse.json({ error: "Valid action is required" }, { status: 400 });
    }

    let requestRef;
    let requestSnap;
    if (requestId) {
      requestRef = adminDb.collection("skillRequests").doc(requestId);
      requestSnap = await requestRef.get();
    } else if (senderId && receiverId) {
      const querySnap = await adminDb
        .collection("skillRequests")
        .where("senderId", "==", senderId)
        .where("receiverId", "==", receiverId)
        .get();
      requestSnap =
        querySnap.docs.find(
          (doc) => String(doc.data().status || "pending") === "pending",
        ) ?? null;
      requestRef = requestSnap ? requestSnap.ref : null;
    }

    if (!requestRef || !requestSnap || !requestSnap.exists) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const request = requestSnap.data() || {};
    const currentStatus = String(request.status || "pending");
    if (currentStatus !== "pending") {
      return NextResponse.json({ ok: true, alreadyHandled: true, status: currentStatus }, { status: 200 });
    }

    const requestSenderId = String(request.senderId || senderId || "");
    const requestReceiverId = String(request.receiverId || receiverId || "");
    if (!requestSenderId || !requestReceiverId) {
      return NextResponse.json({ error: "Request is missing user references" }, { status: 422 });
    }

    const isReceiver = actorId === requestReceiverId;
    const isSender = actorId === requestSenderId;
    if ((action === "accept" || action === "reject") && !isReceiver) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (action === "cancel" && !isSender) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (isPendingExpired(request.createdAt, request.expiresAt)) {
      await requestRef.update({ status: "cancelled", cancelledAt: FieldValue.serverTimestamp(), cancelledReason: "expired" });
      return NextResponse.json({ ok: true, status: "cancelled", expired: true });
    }

    const newStatus = action === "accept" ? "accepted" : action === "reject" ? "rejected" : "cancelled";

    if (newStatus === "accepted") {
      const connectionId = pairId(requestSenderId, requestReceiverId);
      const sessionId = `request_${requestRef.id}`;
      const scheduleDate = request.meetingDateTime || request.schedule;
      const duration = request.duration || 30;

      if (!scheduleDate) {
        await requestRef.update({
          status: "accepted",
          meetingStatus: "not_scheduled",
          sessionId: null,
          respondedAt: FieldValue.serverTimestamp(),
          respondedBy: actorId,
          connectionId,
          chatEnabled: true,
        });
        await createConnectionArtifacts(connectionId, requestSenderId, requestReceiverId, { ...request, id: requestRef.id });
        await markRequestNotificationsHandled(requestRef.id, requestReceiverId, "accepted");
        await adminDb.collection("notifications").add({
          userId: requestSenderId,
          type: "skill_request_response",
          title: "Skill swap request accepted",
          message: `Your request for ${request.offeredSkill} - ${request.requestedSkill} was accepted. You can schedule the meeting from chat.`,
          senderId: requestReceiverId,
          fromUserId: requestReceiverId,
          fromUserName: request.receiverName || null,
          receiverId: requestSenderId,
          requestId: requestRef.id,
          connectRequestId: requestRef.id,
          connectionId,
          offeredSkill: request.offeredSkill || null,
          requestedSkill: request.requestedSkill || null,
          status: "accepted",
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      } else {
        const sessionResult = await scheduleAcceptedRequestWithZoom({
          sessionId,
          requestId: requestRef.id,
          learnerId: requestSenderId,
          providerId: requestReceiverId,
          skillId: String(request.requestedSkill || request.offeredSkill || "") || null,
          topic: `Skill Swap: ${request.offeredSkill || "Skill"} - ${request.requestedSkill || "Session"}`,
          dateTime: scheduleDate as string | Date,
          duration: duration as string | number,
          message: String(request.message || ""),
        });

        await requestRef.update({
          status: "accepted",
          meetingStatus: "scheduled",
          sessionId,
          zoomMeetingId: sessionResult.zoomMeeting.zoomMeetingId,
          joinUrl: sessionResult.zoomMeeting.joinUrl,
          startUrl: sessionResult.zoomMeeting.startUrl,
          respondedAt: FieldValue.serverTimestamp(),
          respondedBy: actorId,
        });
        await createConnectionArtifacts(connectionId, requestSenderId, requestReceiverId, { ...request, id: requestRef.id });
        await requestRef.update({ connectionId, chatEnabled: true });
        await Promise.all([
          adminDb.collection("notifications").add({
            userId: requestSenderId,
            type: "session_accepted",
            title: "Session accepted",
            message: `Your session for ${request.offeredSkill} - ${request.requestedSkill} was accepted and scheduled.`,
            senderId: requestReceiverId,
            receiverId: requestSenderId,
            requestId: requestRef.id,
            sessionId,
            connectionId,
            status: "scheduled",
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          }),
          adminDb.collection("notifications").add({
            userId: requestReceiverId,
            type: "session_scheduled",
            title: "Meeting scheduled",
            message: `Zoom meeting is ready for ${request.offeredSkill} - ${request.requestedSkill}.`,
            senderId: requestSenderId,
            receiverId: requestReceiverId,
            requestId: requestRef.id,
            sessionId,
            connectionId,
            status: "scheduled",
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          }),
        ]);
      }
    } else {
      await requestRef.update({
        status: newStatus,
        meetingStatus: newStatus,
        respondedAt: FieldValue.serverTimestamp(),
        respondedBy: actorId,
        ...(newStatus === "cancelled"
          ? {
              cancelledAt: FieldValue.serverTimestamp(),
              cancellationReason: body.cancellationReason || null,
            }
          : {}),
      });
      await markRequestNotificationsHandled(requestRef.id, requestReceiverId, newStatus);
      await adminDb.collection("notifications").add({
        userId: requestSenderId,
        type: "skill_request_response",
        title: newStatus === "rejected" ? "Skill swap request rejected" : "Skill swap request cancelled",
        message:
          newStatus === "rejected"
            ? `Your request was rejected. You can send a new request from matching.`
            : `Your request for ${request.offeredSkill} - ${request.requestedSkill} was cancelled.`,
        senderId: actorId,
        fromUserId: actorId,
        fromUserName: request.receiverName || null,
        receiverId: requestSenderId,
        requestId: requestRef.id,
        connectRequestId: requestRef.id,
        offeredSkill: request.offeredSkill || null,
        requestedSkill: request.requestedSkill || null,
        status: newStatus,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      ok: true,
      status: newStatus,
      requestId: requestRef.id,
      sessionId:
        newStatus === "accepted" && (request.meetingDateTime || request.schedule)
          ? `request_${requestRef.id}`
          : null,
      connectionId: newStatus === "accepted" ? pairId(requestSenderId, requestReceiverId) : request.connectionId || null,
    });
  } catch (err) {
    console.error("Error responding to skill request:", err);
    if (err instanceof Error) {
      if (err.message === "INSUFFICIENT_CREDITS") {
        return NextResponse.json(
          { error: "Learner needs 1 credit before this session can be scheduled." },
          { status: 402 },
        );
      }
      if (err.message === "INVALID_MEETING_TIME") {
        return NextResponse.json({ error: "Meeting must be scheduled in the future." }, { status: 400 });
      }
      if (err.message === "OVERLAPPING_SESSION") {
        return NextResponse.json({ error: "This meeting overlaps with another booking." }, { status: 409 });
      }
      if (err.message === "ZOOM_CONFIG_MISSING") {
        return NextResponse.json({ error: "Zoom API credentials are not configured." }, { status: 500 });
      }
      if (err.message === "ZOOM_AUTH_FAILED") {
        return NextResponse.json(
          { error: "Zoom authentication failed. Please update the Zoom account ID, client ID, and client secret." },
          { status: 502 },
        );
      }
      if (err.message === "ZOOM_MEETING_FAILED") {
        return NextResponse.json({ error: "Zoom meeting could not be created." }, { status: 502 });
      }
    }
    return NextResponse.json({ error: "Failed to respond to skill request" }, { status: 500 });
  }
}
