import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

function toMillis(value: unknown): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyValue = value as any;
  if (anyValue?.toMillis) return Number(anyValue.toMillis());
  if (value instanceof Date) return value.getTime();
  return 0;
}

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

    const [notificationsSnap, incomingSnap] = await Promise.all([
      adminDb
        .collection("notifications")
        .where("userId", "==", userId)
        .limit(100)
        .get(),
      adminDb
        .collection("connectRequests")
        .where("toUserId", "==", userId)
        .limit(200)
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

    // Create synthetic notifications for pending requests that don't already have a notification doc.
    const pendingConnectRequests = incomingSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((r) => r.status === "pending")
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

    const items = [...pendingConnectRequests, ...notifications]
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      .slice(0, limit);

    const unreadCount = items.reduce(
      (acc, n) => (n?.read ? acc : acc + 1),
      0,
    );

    return NextResponse.json({ notifications: items, unreadCount });
  } catch (err) {
    console.error("Error loading combined notifications (v2):", err);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 },
    );
  }
}

