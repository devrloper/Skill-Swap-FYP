import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { getRequestUser } from "@/app/lib/serverAuth";

export const dynamic = "force-dynamic";

type FeedbackBody = {
  sessionId?: string;
  rating?: number;
  comment?: string;
};

function readDisplayName(data: Record<string, unknown> | undefined, fallback: string) {
  return String(data?.fullName || data?.name || data?.displayName || fallback).trim();
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getRequestUser(req);
    if (!sessionUser?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as FeedbackBody;
    const sessionId = body.sessionId?.trim();
    const rating = Number(body.rating);
    const comment = body.comment?.trim() || "";

    if (!sessionId || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "sessionId and a rating from 1 to 5 are required" },
        { status: 400 },
      );
    }

    const sessionSnap = await adminDb.collection("sessions").doc(sessionId).get();
    if (!sessionSnap.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessionSnap.data() || {};
    const participants = Array.isArray(session.participants)
      ? session.participants.map(String)
      : [];

    if (!participants.includes(sessionUser.uid)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (String(session.status || "") !== "completed") {
      return NextResponse.json(
        { error: "Feedback can be submitted after the session is completed." },
        { status: 400 },
      );
    }

    const reviewerId = sessionUser.uid;
    const targetUserId = participants.find((participantId) => participantId !== reviewerId);
    if (!targetUserId) {
      return NextResponse.json({ error: "Feedback recipient could not be determined." }, { status: 422 });
    }

    const [reviewerProfileSnap, reviewerUserSnap] = await Promise.all([
      adminDb.collection("profiles").doc(reviewerId).get(),
      adminDb.collection("users").doc(reviewerId).get(),
    ]);
    const reviewerName = readDisplayName(
      {
        ...(reviewerUserSnap.exists ? reviewerUserSnap.data() || {} : {}),
        ...(reviewerProfileSnap.exists ? reviewerProfileSnap.data() || {} : {}),
      },
      "Skill Swap Member",
    );

    const feedbackId = `${sessionId}_${sessionUser.uid}`;
    await adminDb.collection("sessionFeedback").doc(feedbackId).set(
      {
        id: feedbackId,
        sessionId,
        userId: reviewerId,
        reviewerId,
        reviewerName,
        targetUserId,
        rating: Math.round(rating),
        comment,
        topic: session.topic || null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await adminDb.collection("sessions").doc(sessionId).set(
      {
        feedback: {
          [reviewerId]: {
            rating: Math.round(rating),
            targetUserId,
            submittedAt: FieldValue.serverTimestamp(),
          },
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const targetFeedbackSnap = await adminDb
      .collection("sessionFeedback")
      .where("targetUserId", "==", targetUserId)
      .get();
    const ratings = targetFeedbackSnap.docs
      .map((doc) => Number(doc.data().rating))
      .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);
    const ratingTotal = ratings.reduce((sum, value) => sum + value, 0);
    const ratingAverage = ratings.length ? Number((ratingTotal / ratings.length).toFixed(1)) : 0;

    await adminDb.collection("profiles").doc(targetUserId).set(
      {
        rating: ratingAverage,
        reviewCount: ratings.length,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Session feedback error:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
