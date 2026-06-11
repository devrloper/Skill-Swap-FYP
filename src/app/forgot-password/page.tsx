"use client";
import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import { showAuthToast } from "@/app/lib/authToast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email) {
        setError("Please enter your email");
        setLoading(false);
        return;
      }

      // Send password reset email
      await sendPasswordResetEmail(auth, email, {
        url: `${globalThis.location.origin}/signin`,
        handleCodeInApp: true,
      });

      setSuccess(true);
      showAuthToast("Password reset email sent! Check your inbox.");

      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push("/signin");
      }, 3000);
    } catch (err: unknown) {
      console.error("Reset password error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to send reset email";
      
      let errorText = "Failed to send reset email";
      if (errorMessage.includes("user-not-found")) {
        errorText = "No account found with this email";
        setError(errorText);
      } else if (errorMessage.includes("invalid-email")) {
        errorText = "Invalid email address";
        setError(errorText);
      } else {
        setError(errorMessage || "Failed to send reset email. Please try again.");
        errorText = errorMessage || "Failed to send reset email";
      }
      showAuthToast("Error", errorText, "error");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/matching.png')",
          }}
        />

        <div className="relative z-10 w-full max-w-md mx-4 sm:mx-6 p-6 sm:p-10 bg-white/50 backdrop-blur-2xl rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-16 h-16 mb-5 bg-green-100 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Check your email!
            </h1>

            <p className="mt-3 text-sm text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>

            <p className="mt-4 text-xs sm:text-sm text-gray-500">
              Click the link in the email to reset your password. The link will expire in 24 hours.
            </p>

            <p className="mt-6 text-xs text-gray-400">
              Redirecting to sign in in a few seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/matching.png')",
        }}
      />

      {/* DARK OVERLAY */}
      {/* <div className="absolute inset-0 bg-black/40" /> */}

      {/* BACKGROUND DOTS  */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 bg-purple-300 rounded-full opacity-50"></div>
        <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-purple-400 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-20 w-2 h-2 bg-purple-300 rounded-full opacity-40"></div>
      </div>

      {/* CARD */}
      <div className="relative z-10 w-full max-w-md mx-4 sm:mx-6 p-6 sm:p-10 bg-white/50 backdrop-blur-2xl rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center text-center">
          {/* ICON */}
          <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 mb-5 bg-purple-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>

          {/* TITLE */}
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            Forgot password?
          </h1>

          <p className="mt-2 mb-6 text-xs sm:text-sm text-gray-500">
            We’ll send you instructions to reset your password.
          </p>
          {/* ERROR MESSAGE */}
          {error && (
            <div className="w-full mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          {/* FORM */}
          <form className="w-full space-y-4" onSubmit={handleResetPassword}>
            <div className="text-left">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="mt-2 w-full px-4 py-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-purple-900 hover:bg-purple-800 disabled:bg-gray-400 text-white font-semibold transition"
            >
              {loading ? "Sending..." : "Reset password"}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-600">
            Remember your password?{" "}
            <a href="/signin" className="text-purple-600 hover:underline font-semibold">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
