import { NextResponse } from "next/server";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { isRequestExpired, toMillis } from "@/app/lib/skill-request-utils";

export const dynamic = "force-dynamic";

function decorateRequest(doc: QueryDocumentSnapshot) {
  const data = doc.data() as Record<string, unknown>;
  return { id: doc.id, ...data, expired: Boolean(data.status === "pending" && isRequestExpired(data)) };
}

async function loadProfileName(userId: string) {
  if (!userId) return "";
  const [profileSnap, userSnap] = await Promise.all([
    adminDb.collection("profiles").doc(userId).get(),
    adminDb.collection("users").doc(userId).get(),
  ]);
  const profile = profileSnap.data() || {};
  const user = userSnap.data() || {};
  return String(profile.fullName || user.fullName || user.displayName || user.name || user.email || "").trim();
}

async function decorateConnectionForUser(doc: QueryDocumentSnapshot, currentUserId: string) {
  const data = doc.data() as Record<string, unknown>;
  const users = Array.isArray(data.users) ? data.users.map(String) : [];
  const peerId =
    String(data.senderId || "") === currentUserId
      ? String(data.receiverId || users.find((id) => id !== currentUserId) || "")
      : String(data.receiverId || "") === currentUserId
        ? String(data.senderId || users.find((id) => id !== currentUserId) || "")
        : users.find((id) => id !== currentUserId) || "";
  const peerName =
    String(data.senderId || "") === currentUserId
      ? String(data.receiverName || "")
      : String(data.receiverId || "") === currentUserId
        ? String(data.senderName || "")
        : "";

  return {
    id: doc.id,
    ...data,
    peerId,
    peerName: peerName || (await loadProfileName(peerId)) || "User",
  };
}

function isActiveRequest(request: Record<string, unknown>) {
  const status = String(request.status || "pending").toLowerCase();
  return status === "pending" || status === "accepted";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const [incomingSnap, outgoingSnap, connectionsSnap] = await Promise.all([
      adminDb.collection("skillRequests").where("receiverId", "==", userId).get(),
      adminDb.collection("skillRequests").where("senderId", "==", userId).get(),
      adminDb.collection("connections").where("users", "array-contains", userId).get(),
    ]);

    const incoming = incomingSnap.docs
      .map(decorateRequest)
      .filter(isActiveRequest)
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
    const outgoing = outgoingSnap.docs
      .map(decorateRequest)
      .filter(isActiveRequest)
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
    const connections = await Promise.all(connectionsSnap.docs
      .map((doc) => decorateConnectionForUser(doc, userId)));
    const activeConnections = connections
      .filter((connection) => connection.status === "accepted")
      .sort((a, b) => toMillis(b.acceptedAt || b.createdAt) - toMillis(a.acceptedAt || a.createdAt));

    return NextResponse.json({ incoming, outgoing, connections: activeConnections });
  } catch (err) {
    console.error("Error loading skill requests (v2):", err);
    return NextResponse.json({ error: "Failed to load skill requests" }, { status: 500 });
  }
}
