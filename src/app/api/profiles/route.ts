import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { toMillis } from "@/app/lib/skill-request-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await adminDb
      .collection("profiles")
      .where("interviewStatus", "==", "Pass")
      .get();

    const profiles = await Promise.all(
      snap.docs.map(async (doc) => {
        const reviewsSnap = await adminDb
          .collection("sessionFeedback")
          .where("targetUserId", "==", doc.id)
          .get();
        const reviews = reviewsSnap.docs
          .map((reviewDoc) => ({ id: reviewDoc.id, ...reviewDoc.data() }))
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        return {
          id: doc.id,
          ...doc.data(),
          reviews,
          reviewCount: reviews.length,
          rating: reviews.length
            ? Number(
                (
                  reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
                  reviews.length
                ).toFixed(1),
              )
            : doc.data().rating || 0,
        };
      }),
    );

    return NextResponse.json({ profiles });
  } catch (err) {
    console.error("Error loading profiles (API):", err);
    return NextResponse.json(
      { error: "Failed to load profiles" },
      { status: 500 }
    );
  }
}
