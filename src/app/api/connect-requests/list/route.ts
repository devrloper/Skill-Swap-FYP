import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

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
        .orderBy("createdAt", "desc")
        .limit(50)
        .get(),
      adminDb
        .collection("connectRequests")
        .where("fromUserId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get(),
    ]);

    const incoming = incomingSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const outgoing = outgoingSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ incoming, outgoing });
  } catch (err) {
    console.error("Error loading connect requests:", err);
    return NextResponse.json(
      { error: "Failed to load connect requests" },
      { status: 500 },
    );
  }
}

