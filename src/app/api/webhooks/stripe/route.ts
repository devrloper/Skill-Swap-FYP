import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { confirmStripePaidCredits } from "@/app/lib/creditLogic";
import { PAID_CREDIT_PACKS } from "@/app/lib/creditConstants";

export const dynamic = "force-dynamic";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.error("STRIPE_WEBHOOK_SECRET is not set");
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature") || "";
  const body = await req.text();

  let event;

  try {
    if (!webhookSecret) {
      throw new Error("Webhook secret not configured");
    }

    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        
        if (session.payment_status === "paid") {
          const userId = session.metadata?.userId;
          const packId = session.metadata?.packId as keyof typeof PAID_CREDIT_PACKS;

          if (!userId || !packId || !(packId in PAID_CREDIT_PACKS)) {
            console.error("Invalid session metadata:", session.metadata);
            return NextResponse.json(
              { error: "Invalid payment metadata" },
              { status: 400 }
            );
          }

          try {
            // Confirm the purchase and award credits
            const result = await confirmStripePaidCredits({
              stripeSessionId: session.id,
              userId,
              packId,
            });

            console.log("Credits awarded successfully:", result);
          } catch (error) {
            console.error("Error confirming payment:", error);
            // Return success anyway to prevent Stripe from retrying
            // The webhook can be manually processed if needed
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        // Handle refund logic if needed
        console.log("Charge refunded:", charge.id);
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object;
        console.log("Dispute created:", dispute.id);
        // Send notification to admin
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
