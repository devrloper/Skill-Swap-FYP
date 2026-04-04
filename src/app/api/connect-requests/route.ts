import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

type CreateConnectRequestBody = {
  fromUserId?: string;
  toUserId?: string;
};

function canSendConnectRequests(profile: Record<string, unknown>) {
  const hasEnrollment = Boolean(
    profile.enrolled ||
      profile.profileCompleted ||
      (Array.isArray(profile.completedSteps) && profile.completedSteps.includes(4)),
  );
  const hasInterview = Boolean(
    profile.interviewStatus || profile.interviewScore || profile.interview,
  );

  return hasEnrollment && hasInterview;
}

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

    const fromProfileSnap = await adminDb
      .collection("profiles")
      .doc(fromUserId)
      .get();
    const fromProfile = fromProfileSnap.exists ? (fromProfileSnap.data() || {}) : null;

    if (!fromProfile || !canSendConnectRequests(fromProfile)) {
      return NextResponse.json(
        {
          error:
            "Complete enrollment and the AI interview before sending connect requests.",
        },
        { status: 403 },
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

    const fromUserName = (fromProfile.fullName ||
      fromProfile.name ||
      fromProfile.displayName) as string | undefined;

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

