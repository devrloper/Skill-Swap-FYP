import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { getRequestUser } from "@/app/lib/serverAuth";
import { pairId, toMillis } from "@/app/lib/skill-request-utils";

export const dynamic = "force-dynamic";

type RespondBody = {
  requestId?: string;
  senderId?: string;
  receiverId?: string;
  fromUserId?: string;
  toUserId?: string;
  action?: "accept" | "reject" | "cancel";
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
        .limit(1)
        .get();
      requestSnap = querySnap.docs[0] ?? null;
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
    await requestRef.update({ status: newStatus, respondedAt: FieldValue.serverTimestamp(), respondedBy: actorId });

    if (newStatus === "accepted") {
      const connectionId = pairId(requestSenderId, requestReceiverId);
      await createConnectionArtifacts(connectionId, requestSenderId, requestReceiverId, { ...request, id: requestRef.id });
      await requestRef.update({ connectionId, chatEnabled: true });
      await adminDb.collection("notifications").add({
        userId: requestSenderId,
        type: "skill_request_response",
        title: "Skill swap request accepted",
        message: `Your request for ${request.offeredSkill} - ${request.requestedSkill} was accepted.`,
        senderId: requestReceiverId,
        receiverId: requestSenderId,
        requestId: requestRef.id,
        connectionId,
        status: "accepted",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    } else {
      await adminDb.collection("notifications").add({
        userId: requestSenderId,
        type: "skill_request_response",
        title: newStatus === "rejected" ? "Skill swap request rejected" : "Skill swap request cancelled",
        message:
          newStatus === "rejected"
            ? `Your request for ${request.offeredSkill} - ${request.requestedSkill} was rejected.`
            : `Your request for ${request.offeredSkill} - ${request.requestedSkill} was cancelled.`,
        senderId: actorId,
        receiverId: requestSenderId,
        requestId: requestRef.id,
        status: newStatus,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      ok: true,
      status: newStatus,
      requestId: requestRef.id,
      connectionId: newStatus === "accepted" ? pairId(requestSenderId, requestReceiverId) : request.connectionId || null,
    });
  } catch (err) {
    console.error("Error responding to skill request:", err);
    return NextResponse.json({ error: "Failed to respond to skill request" }, { status: 500 });
  }
}
