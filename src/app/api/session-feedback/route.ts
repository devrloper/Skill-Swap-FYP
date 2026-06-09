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

    const feedbackId = `${sessionId}_${sessionUser.uid}`;
    await adminDb.collection("sessionFeedback").doc(feedbackId).set(
      {
        id: feedbackId,
        sessionId,
        userId: sessionUser.uid,
        rating: Math.round(rating),
        comment,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await adminDb.collection("sessions").doc(sessionId).set(
      {
        feedback: {
          [sessionUser.uid]: {
            rating: Math.round(rating),
            submittedAt: FieldValue.serverTimestamp(),
          },
        },
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
