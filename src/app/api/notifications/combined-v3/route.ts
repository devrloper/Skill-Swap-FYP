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

async function loadProfileNames(userIds: string[]) {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return {} as Record<string, string>;

  const refs = unique.map((id) => adminDb.collection("profiles").doc(id));
  const snaps = await adminDb.getAll(...refs);

  const map: Record<string, string> = {};
  for (let i = 0; i < snaps.length; i++) {
    const snap = snaps[i];
    if (!snap.exists) continue;
    const data = snap.data() || {};
    map[unique[i]] = (data.fullName ||
      data.name ||
      data.displayName ||
      "User") as string;
  }
  return map;
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

    const [notificationsSnap, connectRequestsSnap] = await Promise.all([
      adminDb.collection("notifications").where("userId", "==", userId).get(),
      adminDb.collection("connectRequests").where("toUserId", "==", userId).get(),
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

    const pendingRequests = connectRequestsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((r) => r.status === "pending");

    const syntheticPending = pendingRequests
      .filter((r) => !existingConnectIds.has(r.id))
      .map((r) => ({
        id: `connect:${r.id}`,
        userId,
        type: "connect_request",
        title: "New connect request",
        message: "Someone sent you a connect request.",
        fromUserId: r.fromUserId,
        fromUserName: r.fromUserName,
        connectRequestId: r.id,
        read: false,
        createdAt: r.createdAt,
      }));

    const rawItems = [...syntheticPending, ...notifications].filter((item) => {
      const type = String(item.type || "");
      if (type !== "connect_request" && type !== "skill_request") return true;
      return String(item.status || "pending").toLowerCase() === "pending";
    });

    const profileNameMap = await loadProfileNames(
      rawItems
        .map((n) => n.fromUserId as string)
        .filter(Boolean),
    );

    const items = rawItems
      .map((n) => {
        const fromUserId = n.fromUserId as string | undefined;
        const fromUserName =
          (n.fromUserName as string | undefined) ||
          (fromUserId ? profileNameMap[fromUserId] : undefined);

        if (n.type === "connect_request") {
          return {
            ...n,
            fromUserName: fromUserName || null,
            message: fromUserName
              ? `${fromUserName} sent you a connect request.`
              : (n.message as string),
          };
        }

        return { ...n, fromUserName: fromUserName || null };
      })
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      .slice(0, limit);

    const unreadCount = items.reduce(
      (acc, n) => (n?.read ? acc : acc + 1),
      0,
    );

    return NextResponse.json({ notifications: items, unreadCount });
  } catch (err) {
    console.error("Error loading combined notifications (v3):", err);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 },
    );
  }
}

