"use client";

import React from "react";

interface AIInterviewCardProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onStart?: () => void;
}

const AIInterviewCard: React.FC<AIInterviewCardProps> = ({
  title = "AI Interview",
  description = "Answer AI-powered questions to complete your profile.",
  buttonText = "Start Interview",
  onStart,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12 text-center shadow-2xl backdrop-blur w-full max-w-md">
      <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-cyan-400/30 blur-xl" />
      <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-fuchsia-500/30 blur-xl" />

      <div className="mb-6">
        <svg
          className="w-20 h-20 mx-auto text-cyan-300"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{title}</h3>

      <p className="text-slate-300 text-sm md:text-base mb-6">{description}</p>

      <button
        onClick={onStart}
        className="cursor-pointer bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-semibold text-sm md:text-base hover:scale-105 transition-transform"
      >
        {buttonText}
      </button>
    </div>
  );
};

export default AIInterviewCard;
