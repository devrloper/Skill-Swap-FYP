"use client";
import React from "react";

const ForgotPassword = () => {
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

          {/* FORM */}
          <form
            className="w-full space-y-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="text-left">
              <label className="text-sm font-medium text-gray-700">Email</label>

              <input
                type="email"
                placeholder="Enter your email"
                className="mt-2 w-full px-4 py-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-purple-900 hover:bg-purple-900 text-white font-semibold transition"
            >
              Reset password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
