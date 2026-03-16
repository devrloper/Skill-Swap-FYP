import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

type CreateConnectRequestBody = {
  fromUserId?: string;
  toUserId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateConnectRequestBody;
    const fromUserId = body?.fromUserId?.trim();
    const toUserId = body?.toUserId?.trim();

    if (!fromUserId || !toUserId) {
      return NextResponse.json(
        { error: "fromUserId and toUserId are required" },
        { status: 400 },
      );
    }

    if (fromUserId === toUserId) {
      return NextResponse.json(
        { error: "Cannot send a connect request to yourself" },
        { status: 400 },
      );
    }

    const connectRequestId = `${fromUserId}_${toUserId}`;
    const connectRequestRef = adminDb
      .collection("connectRequests")
      .doc(connectRequestId);

    const existing = await connectRequestRef.get();
    if (existing.exists) {
      return NextResponse.json({ ok: true, alreadyRequested: true });
    }

    await connectRequestRef.set({
      fromUserId,
      toUserId,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });

    await adminDb.collection("notifications").add({
      userId: toUserId,
      type: "connect_request",
      title: "New connect request",
      message: "Someone wants to connect with you.",
      fromUserId,
      connectRequestId,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, connectRequestId });
  } catch (err) {
    console.error("Error creating connect request:", err);
    return NextResponse.json(
      { error: "Failed to create connect request" },
      { status: 500 },
    );
  }
}

