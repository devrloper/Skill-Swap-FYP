import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { getRequestUser } from "@/app/lib/serverAuth";
import { pairId } from "@/app/lib/skill-request-utils";

export const dynamic = "force-dynamic";

type ReportBody = {
  reportedUserId?: string;
  reason?: string;
  details?: string;
};

const ALLOWED_REASONS = new Set([
  "harassment",
  "spam",
  "inappropriate_content",
  "fake_profile",
  "unsafe_behavior",
  "other",
]);

export async function POST(req: Request) {
  try {
    const sessionUser = await getRequestUser(req);
    if (!sessionUser?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ReportBody;
    const reportedUserId = body.reportedUserId?.trim() || "";
    const reason = body.reason?.trim() || "";
    const details = body.details?.trim() || "";

    if (!reportedUserId || reportedUserId === sessionUser.uid) {
      return NextResponse.json({ error: "Invalid reported user." }, { status: 400 });
    }

    if (!ALLOWED_REASONS.has(reason)) {
      return NextResponse.json({ error: "Please select a valid report reason." }, { status: 400 });
    }

    if (details.length > 1000) {
      return NextResponse.json({ error: "Report details are too long." }, { status: 400 });
    }

    const chatId = pairId(sessionUser.uid, reportedUserId);
    const chatSnap = await adminDb.collection("chatRooms").doc(chatId).get();
    if (!chatSnap.exists) {
      return NextResponse.json(
        { error: "You can only report users you have chatted with." },
        { status: 403 },
      );
    }

    const participants = Array.isArray(chatSnap.data()?.participants)
      ? chatSnap.data()?.participants.map(String)
      : [];
    if (!participants.includes(sessionUser.uid) || !participants.includes(reportedUserId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reportRef = adminDb.collection("userReports").doc();
    await reportRef.set({
      id: reportRef.id,
      reporterId: sessionUser.uid,
      reporterEmail: sessionUser.email || null,
      reportedUserId,
      reason,
      details,
      chatId,
      status: "open",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, reportId: reportRef.id });
  } catch (error) {
    console.error("Report user error:", error);
    return NextResponse.json({ error: "Failed to submit report." }, { status: 500 });
  }
}
