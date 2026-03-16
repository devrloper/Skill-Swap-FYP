import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();
    const limitParam = Number(searchParams.get("limit") || "20");
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 50)
      : 20;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const [notificationsSnap, pendingSnap] = await Promise.all([
      adminDb
        .collection("notifications")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get(),
      adminDb
        .collection("connectRequests")
        .where("toUserId", "==", userId)
        .where("status", "==", "pending")
        .orderBy("createdAt", "desc")
        .limit(25)
        .get(),
    ]);

    const notifications = notificationsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const existingConnectIds = new Set(
      notifications
        .filter((n) => n?.type === "connect_request" && n?.connectRequestId)
        .map((n) => n.connectRequestId as string),
    );

    const syntheticPending = pendingSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((r) => !existingConnectIds.has(r.id))
      .map((r) => ({
        id: `connect:${r.id}`,
        userId,
        type: "connect_request",
        title: "New connect request",
        message: "Someone wants to connect with you.",
        fromUserId: r.fromUserId,
        connectRequestId: r.id,
        read: false,
        createdAt: r.createdAt,
      }));

    const items = [...syntheticPending, ...notifications];

    const unreadCount = items.reduce(
      (acc, n) => (n?.read ? acc : acc + 1),
      0,
    );

    return NextResponse.json({ notifications: items, unreadCount });
  } catch (err) {
    console.error("Error loading combined notifications:", err);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 },
    );
  }
}

