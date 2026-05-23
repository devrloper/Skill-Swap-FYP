"use client";

import { useState } from "react";
import { PAID_CREDIT_PACKS } from "@/app/lib/creditConstants";
import toast from "react-hot-toast";

type PackId = keyof typeof PAID_CREDIT_PACKS;

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateCheckout = async (packId: PackId) => {
    if (!packId || !(packId in PAID_CREDIT_PACKS)) {
      setError("Invalid credit pack selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate checkout");
      }

      if (!data.checkoutUrl) {
        throw new Error("No checkout URL received");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Checkout failed";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    initiateCheckout,
    loading,
    error,
  };
}

export function useCheckoutSuccess() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Check if we're on success page with session ID
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const newSessionId = params.get("session_id");
    const paymentStatus = params.get("payment");

    if (paymentStatus === "success" && newSessionId && !sessionId) {
      setSessionId(newSessionId);
    }
  }

  return {
    isSuccess: sessionId !== null,
    sessionId,
  };
}
