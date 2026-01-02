"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full bg-white/70 backdrop-blur-md z-50 shadow-sm transition-all duration-300">
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
        <div className="hidden lg:flex items-center space-x-8 cursor-pointer">
          <Link href="/" className="text-gray-700 hover:text-purple-600">
            Home
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-purple-600">
            About
          </Link>
          <Link href="/trendingskills" className="text-gray-700 hover:text-purple-600">
          Trending Skills
          </Link>
          <Link href="#" className="text-gray-700 hover:text-purple-600">
            Matching
          </Link>
          <Link href="/chating" className="text-gray-700 hover:text-purple-600">
            Chating
          </Link>
          <Link href="/chatbot" className="text-gray-700 hover:text-purple-600">
            AI Chat Bot
          </Link>
          <Link href="#" className="text-gray-700 hover:text-purple-600">
            Dashboard
          </Link>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex items-center space-x-4">
          <Link href="/signin" className="text-purple-600 font-medium hover:text-purple-700 transition">
            Sign In
          </Link>
          <Link  href="signup"  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-md font-medium shadow-md hover:opacity-90 transition">
            Sign Up
          </Link>
        </div>

        {/* Mobile/Tablet Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden text-gray-700 focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile & Tablet Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white/90 backdrop-blur-md px-6 py-4 space-y-3 border-t border-gray-200 transition-all duration-300">
          {["Home", "Profile", "Matching", "Chating", "Dashboard", "AI Chat Bot"].map((item) => (
            <Link
              key={item}
              href="#"
              className="block text-gray-700 hover:text-purple-600 text-base font-medium transition"
            >
              {item}
            </Link>
          ))}

          <div className="pt-3 border-t border-gray-200 space-y-3">
            <button className="w-full text-purple-600 font-medium border border-purple-600 px-4 py-2 rounded-md hover:bg-purple-50 transition">
              Sign In
            </button>
            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-md font-medium shadow-md hover:opacity-90 transition">
              Sign Up
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
