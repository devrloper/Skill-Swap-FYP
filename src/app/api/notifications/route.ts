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

    const snap = await adminDb
      .collection("notifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const notifications = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const unreadCount = notifications.reduce(
      (acc, n) => (n?.read ? acc : acc + 1),
      0,
    );

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("Error loading notifications:", err);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 },
    );
  }
}

type MarkReadBody = {
  notificationId?: string;
  userId?: string;
};

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as MarkReadBody;
    const notificationId = body?.notificationId?.trim();
    const userId = body?.userId?.trim();

    if (!notificationId || !userId) {
      return NextResponse.json(
        { error: "notificationId and userId are required" },
        { status: 400 },
      );
    }

    const ref = adminDb.collection("notifications").doc(notificationId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = snap.data();
    if (data?.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await ref.update({ read: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error marking notification read:", err);
    return NextResponse.json(
      { error: "Failed to mark read" },
      { status: 500 },
    );
  }
}

