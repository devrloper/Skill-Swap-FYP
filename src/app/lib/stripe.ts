import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(stripeKey, {
  apiVersion: "2026-04-22.dahlia",
});

export const STRIPE_CURRENCY = "pkr";

export function pkrToMinorUnits(pkrAmount: number): number {
  return Math.round(pkrAmount * 100);
}
