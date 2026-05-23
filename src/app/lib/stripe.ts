import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(stripeKey, {
  apiVersion: "2026-04-22.dahlia",
});

export const STRIPE_CURRENCY = "usd"; // Stripe supports USD - we'll convert PKR to USD
export const STRIPE_EXCHANGE_RATE = 0.003422; // 1 PKR = 0.003422 USD (1 USD = 292.34 PKR)

export function pkrToUsd(pkrAmount: number): number {
  return Math.round(pkrAmount * STRIPE_EXCHANGE_RATE * 100) / 100;
}

export function usdToCents(usdAmount: number): number {
  return Math.round(usdAmount * 100);
}
