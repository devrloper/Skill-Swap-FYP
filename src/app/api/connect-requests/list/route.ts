import { NextResponse } from "next/server";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { isRequestExpired, toMillis } from "@/app/lib/skill-request-utils";

export const dynamic = "force-dynamic";

function decorateRequest(doc: QueryDocumentSnapshot) {
  const data = doc.data() as Record<string, unknown>;
  return { id: doc.id, ...data, expired: Boolean(data.status === "pending" && isRequestExpired(data)) };
}

function decorateConnection(doc: QueryDocumentSnapshot) {
  return { id: doc.id, ...doc.data() };
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
    const connections = connectionsSnap.docs
      .map(decorateConnection)
      .filter((connection) => connection.status === "accepted")
      .sort((a, b) => toMillis(b.acceptedAt || b.createdAt) - toMillis(a.acceptedAt || a.createdAt));

    return NextResponse.json({ incoming, outgoing, connections });
  } catch (err) {
    console.error("Error loading skill requests:", err);
    return NextResponse.json({ error: "Failed to load skill requests" }, { status: 500 });
  }
}
