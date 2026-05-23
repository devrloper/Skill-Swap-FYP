import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { getRequestUser } from "@/app/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getRequestUser(req);
    if (!sessionUser?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Get the purchase record
    const purchaseSnap = await adminDb
      .collection("creditPurchases")
      .where("stripeSessionId", "==", sessionId)
      .limit(1)
      .get();

    if (purchaseSnap.empty) {
      return NextResponse.json(
        { error: "Purchase record not found" },
        { status: 404 }
      );
    }

    const purchase = purchaseSnap.docs[0].data();

    // Verify it belongs to the current user
    if (purchase.userId !== sessionUser.uid) {
      return NextResponse.json(
        { error: "Unauthorized access to purchase" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: purchase.status,
      creditsAdded: purchase.credits,
      packLabel: purchase.label,
      amount: purchase.amount,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
