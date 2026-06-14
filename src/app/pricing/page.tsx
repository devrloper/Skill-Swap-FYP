"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Coins, CreditCard, Loader2 } from "lucide-react";
import Navbar from "@/app/components/innernavbar/page";
import PaymentSuccessComponent from "@/app/components/paymentsuccesscomponent/page";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const creditPacks = [
  {
    id: "starter",
    name: "Starter Credits",
    credits: 5,
    price: 499,
    desc: "For a few skill swap sessions.",
    popular: false,
  },
  {
    id: "growth",
    name: "Growth Credits",
    credits: 12,
    price: 999,
    desc: "Best value for active learners.",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro Credits",
    credits: 30,
    price: 1999,
    desc: "For frequent scheduling.",
    popular: false,
  },
] as const;

export default function PricingPage() {
  const [loadingPack, setLoadingPack] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setSignedIn(Boolean(user)));
  }, []);

  const buyCredits = async (packId: string) => {
    setMessage("");
    setError("");

    const user = auth.currentUser;
    if (!user) {
      setError("Please sign in first to buy credits.");
      return;
    }

    setLoadingPack(packId);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        credentials: "include",
        body: JSON.stringify({ packId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Checkout failed.");
      }

      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setLoadingPack("");
    }
  };

  return (
    <>
      <Navbar />
      <PaymentSuccessComponent />
      <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28">
        <section className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1 text-xs font-bold text-purple-700 shadow-sm">
                <Coins className="h-4 w-4" />
                Paid Credits
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
                Buy credits to schedule more sessions
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Passing the AI interview gives free credits. When those credits finish,
                buy a pack to keep scheduling skill swap meetings.
              </p>
            </div>
            {!signedIn && (
              <Link
                href="/signin?next=/pricing"
                className="inline-flex items-center justify-center rounded-full bg-purple-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-800"
              >
                Sign in to buy
              </Link>
            )}
          </div>

          {(message || error) && (
            <div
              className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                error
                  ? "border-red-100 bg-red-50 text-red-700"
                  : "border-emerald-100 bg-emerald-50 text-emerald-700"
              }`}
            >
              {error || message}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-3">
            {creditPacks.map((pack) => (
              <article
                key={pack.id}
                className={`relative rounded-lg border bg-white p-6 shadow-sm ${
                  pack.popular ? "border-purple-500 shadow-purple-100" : "border-slate-200"
                }`}
              >
                {pack.popular && (
                  <span className="absolute right-4 top-4 rounded-full bg-purple-700 px-3 py-1 text-[11px] font-bold text-white">
                    Best Value
                  </span>
                )}

                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-700">
                  <Coins className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">{pack.name}</h2>
                <p className="mt-2 text-sm text-slate-500">{pack.desc}</p>

                <div className="mt-6">
                  <span className="text-4xl font-black text-slate-900">
                    {pack.credits}
                  </span>
                  <span className="ml-2 text-sm font-bold text-slate-500">credits</span>
                </div>
                <p className="mt-2 text-lg font-bold text-purple-700">
                  PKR {pack.price.toLocaleString()}
                </p>

                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    1 meeting schedule costs 1 credit
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Provider cancellations refund automatically
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Learner cancellations refund only 24h+ before
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => buyCredits(pack.id)}
                  disabled={loadingPack === pack.id}
                  className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    pack.popular
                      ? "bg-purple-700 text-white hover:bg-purple-800"
                      : "border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                  }`}
                >
                  {loadingPack === pack.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Buy Credits
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
