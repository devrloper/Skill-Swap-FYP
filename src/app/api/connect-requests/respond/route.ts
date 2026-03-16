import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

type RespondBody = {
  fromUserId?: string;
  toUserId?: string;
  action?: "accept" | "reject";
};

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as RespondBody;
    const fromUserId = body?.fromUserId?.trim();
    const toUserId = body?.toUserId?.trim();
    const action = body?.action;

    if (
      !fromUserId ||
      !toUserId ||
      (action !== "accept" && action !== "reject")
    ) {
      return NextResponse.json(
        { error: "fromUserId, toUserId, and valid action are required" },
        { status: 400 },
      );
    }

    const connectRequestId = `${fromUserId}_${toUserId}`;
    const connectRequestRef = adminDb
      .collection("connectRequests")
      .doc(connectRequestId);

    const snap = await connectRequestRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const data = snap.data();
    if (data?.status !== "pending") {
      return NextResponse.json(
        { ok: true, alreadyHandled: true, status: data?.status },
        { status: 200 },
      );
    }

    const newStatus = action === "accept" ? "accepted" : "rejected";

    await connectRequestRef.update({
      status: newStatus,
      respondedAt: FieldValue.serverTimestamp(),
    });

    await adminDb.collection("notifications").add({
      userId: fromUserId,
      type: "connect_response",
      title:
        newStatus === "accepted"
          ? "Connect request accepted"
          : "Connect request rejected",
      message:
        newStatus === "accepted"
          ? "Your connect request was accepted."
          : "Your connect request was rejected.",
      fromUserId: toUserId,
      connectRequestId,
      status: newStatus,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, status: newStatus, connectRequestId });
  } catch (err) {
    console.error("Error responding to connect request:", err);
    return NextResponse.json(
      { error: "Failed to respond to connect request" },
      { status: 500 },
    );
  }
}

