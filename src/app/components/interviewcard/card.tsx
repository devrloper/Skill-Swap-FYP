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
    <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-8 md:p-12 max-w-lg mx-auto mt-12 text-center transition-transform transform hover:scale-105">
      
      {/* Optional Illustration */}
      <div className="mb-6">
        <svg
          className="w-20 h-20 mx-auto text-purple-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Title */}
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base mb-6">
        {description}
      </p>

      {/* Start Button */}
      <button
        onClick={onStart}
        className=" cursor-pointer bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base hover:scale-105 transition-transform"
      >
        {buttonText}
      </button>
    </div>
  );
};

export default AIInterviewCard;
