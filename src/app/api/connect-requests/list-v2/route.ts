import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

function toMillis(value: unknown): number {
  // Firestore Timestamp has toMillis(), Date has getTime()
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

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const [incomingSnap, outgoingSnap] = await Promise.all([
      adminDb
        .collection("connectRequests")
        .where("toUserId", "==", userId)
        .limit(200)
        .get(),
      adminDb
        .collection("connectRequests")
        .where("fromUserId", "==", userId)
        .limit(200)
        .get(),
    ]);

    const incoming = incomingSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

    const outgoing = outgoingSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

    return NextResponse.json({ incoming, outgoing });
  } catch (err) {
    console.error("Error loading connect requests (v2):", err);
    return NextResponse.json(
      { error: "Failed to load connect requests" },
      { status: 500 },
    );
  }
}

