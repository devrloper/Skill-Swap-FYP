"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MdCheckCircle, MdError } from "react-icons/md";
import toast from "react-hot-toast";

export default function PaymentSuccessComponent() {
  const router = useRouter();
  const [status, setStatus] = useState<"success" | "cancelled" | null>(null);
  const [creditsAdded, setCreditsAdded] = useState(0);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check URL parameters
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    const sessionId = params.get("session_id");

    if (paymentStatus === "success") {
      setStatus("success");
      toast.success("Payment successful! Credits have been added to your account.");
      
      // Verify the session if provided
      if (sessionId) {
        verifyPayment(sessionId);
      } else {
        // Wait 2 seconds before redirecting if no session ID
        setTimeout(() => {
          router.push("/pricing");
        }, 2000);
      }
    } else if (paymentStatus === "cancelled") {
      setStatus("cancelled");
      toast.error("Payment was cancelled.");
      
      // Redirect to pricing page after 2 seconds
      setTimeout(() => {
        router.push("/pricing");
      }, 2000);
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const response = await fetch(
        `/api/credits/verify-payment?sessionId=${sessionId}`
      );
      if (response.ok) {
        const data = await response.json();
        setCreditsAdded(data.creditsAdded || 0);
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
    } finally {
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/pricing");
      }, 3000);
      setIsChecking(false);
    }
  };

  // Don't render if no payment status found
  if (isChecking || !status) {
    return null;
  }

  if (status === "success") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <MdCheckCircle className="mx-auto mb-4 text-green-500" size={80} />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-4">
            Your credits have been added to your account.
          </p>
          {creditsAdded > 0 && (
            <p className="text-xl font-semibold text-blue-600 mb-6">
              +{creditsAdded} Credits Added
            </p>
          )}
          <p className="text-sm text-gray-500">
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <MdError className="mx-auto mb-4 text-red-500" size={80} />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Payment Cancelled
          </h1>
          <p className="text-gray-600 mb-4">
            Your payment was cancelled. No charges were made to your account.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return null;
}
