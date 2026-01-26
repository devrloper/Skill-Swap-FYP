"use client";

import Link from "next/link";
import { useState } from "react";
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <header className="fixed top-0 left-0 w-full bg-white/70 backdrop-blur-md z-50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-lg w-10 h-10 flex items-center justify-center rounded-full">
            S
          </div>
          <span className="text-lg sm:text-xl font-semibold text-gray-800 whitespace-nowrap">
            Skill Swap
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center space-x-8"></div>

        {/* Desktop Right Section */}
        <div className="hidden lg:flex items-center gap-4">
          <button className="relative">
            <Link
              href="/signin"
              className="text-purple-600 font-medium hover:text-purple-700 transition"
            >
              Sign In
            </Link>
          </button>
          <button className="relative">
            <Link
              href="signup"
              className="bg-gradient-to-r from-purple-950 to-pink-600 text-white px-4 py-2 rounded-md font-medium shadow-md hover:opacity-90 transition"
            >
              Sign Up
            </Link>
          </button>
        </div>

        {/* Mobile Right Section */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-700 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile / Tablet Menu */}
      {isOpen && (
        <div className=" lg:hidden  bg-white/90 backdrop-blur-md  px-4 sm:px-6  py-4 border-t border-gray-200 flex flex-col items-center gap-3">
          <Link
            href="/signin"
            className=" text-purple-600 font-medium px-6 py-2 rounded-md hover:text-purple-700  hover:bg-purple-50 transition "
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="bg-gradient-to-r from-purple-950 to-pink-600 text-white  px-6 py-2 rounded-md  font-medium shadow-md hover:opacity-90 transition"
          >
            Sign Up
          </Link>
        </div>
      )}
    </header>
  );
}
