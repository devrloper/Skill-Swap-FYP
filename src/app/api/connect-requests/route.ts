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

    let fromUserName: string | undefined;
    try {
      const fromProfileSnap = await adminDb
        .collection("profiles")
        .doc(fromUserId)
        .get();
      if (fromProfileSnap.exists) {
        const fromProfile = fromProfileSnap.data() || {};
        fromUserName = (fromProfile.fullName ||
          fromProfile.name ||
          fromProfile.displayName) as string | undefined;
      }
    } catch {
      // best effort only
    }


    await connectRequestRef.set({
      fromUserId,
      toUserId,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      fromUserName: fromUserName || null,
    });

    await adminDb.collection("notifications").add({
      userId: toUserId,
      type: "connect_request",
      title: "New connect request",
      message: fromUserName
        ? fromUserName + " sent you a connect request."
        : "Someone sent you a connect request.",
      fromUserId,
      fromUserName: fromUserName || null,
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

