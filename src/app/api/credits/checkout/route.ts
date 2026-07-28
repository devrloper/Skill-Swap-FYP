import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_CURRENCY, STRIPE_EXCHANGE_RATE, usdToCents } from "@/app/lib/stripe";
import { PAID_CREDIT_PACKS } from "@/app/lib/creditConstants";
import { getRequestUser } from "@/app/lib/serverAuth";
import { createStripePendingPurchase } from "@/app/lib/creditLogic";

export const dynamic = "force-dynamic";

type CheckoutBody = {
  packId?: keyof typeof PAID_CREDIT_PACKS;
};

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getRequestUser(req);
    console.log("Session user:", sessionUser?.email, "UID:", sessionUser?.uid);
    
    if (!sessionUser?.uid || !sessionUser?.email) {
      console.error("User not authenticated or missing email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CheckoutBody;
    const packId = body.packId;
    console.log("Requested packId:", packId);

    if (!packId || !(packId in PAID_CREDIT_PACKS)) {
      console.error("Invalid packId:", packId, "Available packs:", Object.keys(PAID_CREDIT_PACKS));
      return NextResponse.json(
        { error: "Please choose a valid credit pack" },
        { status: 400 }
      );
    }

    const pack = PAID_CREDIT_PACKS[packId];
    console.log("Pack details:", pack);
    
    const priceInUsd = pack.price * STRIPE_EXCHANGE_RATE;
    const priceInCents = usdToCents(priceInUsd);
    console.log(`Converting PKR ${pack.price} to USD: ${priceInUsd}, cents: ${priceInCents}`);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: sessionUser.email,
      client_reference_id: `${sessionUser.uid}-${packId}-${Date.now()}`,
      metadata: {
        userId: sessionUser.uid,
        packId: packId,
        originalPrice: pack.price.toString(),
        originalCurrency: "PKR",
      },
      line_items: [
        {
          price_data: {
            currency: STRIPE_CURRENCY,
            product_data: {
              name: pack.label,
              description: `Get ${pack.credits} credits for Skill-Swap`,
              metadata: {
                packId: packId,
                credits: pack.credits.toString(),
              },
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/pricing?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/pricing?payment=cancelled`,
    });

    console.log("Stripe session created:", session.id);
    await createStripePendingPurchase({
      userId: sessionUser.uid,
      packId,
      stripeSessionId: session.id,
      amount: priceInCents,
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
