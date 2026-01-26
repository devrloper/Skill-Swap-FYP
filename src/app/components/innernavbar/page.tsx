"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinkClass =
    "relative text-gray-700 hover:text-purple-600 transition font-medium after:absolute after:left-1/2 after:-bottom-1 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-purple-600 after:to-pink-500 after:transition-all after:duration-300 hover:after:w-full hover:after:left-0";

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
        <div className="hidden lg:flex items-center space-x-8">
          <Link href="/home" className={navLinkClass}>Home</Link>
          <Link href="/about" className={navLinkClass}>About</Link>
          <Link href="/trendingskills" className={navLinkClass}>Trending Skills</Link>
          <Link href="/matching" className={navLinkClass}>Matching</Link>
          <Link href="/chating" className={navLinkClass}>Chating</Link>
          <Link href="/chatbot" className={navLinkClass}>AI Chat Bot</Link>
          <Link href="/dashboard" className={navLinkClass}>Dashboard</Link>
        </div>

        {/* Desktop Right Section */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Notifications */}
          <button className="relative">
            <Bell className="w-6 h-6 text-gray-700 hover:text-purple-600 transition" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {/* User Avatar */}
          <div className="relative">
            <img
              src="/user-avatar.png"
              alt="User"
              className="w-9 h-9 rounded-full object-cover border border-gray-300"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>
        </div>

        {/* Mobile Right Section */}
        <div className="flex items-center gap-3 lg:hidden">
          <button className="relative">
            <Bell className="w-6 h-6 text-gray-700" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          <img
            src="/user-avatar.png"
            alt="User"
            className="w-8 h-8 rounded-full object-cover border"
          />

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-700 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white/90 backdrop-blur-md px-6 py-4 space-y-3 border-t border-gray-200">
          {[
            { name: "Home", href: "/" },
            { name: "Profile", href: "/profile" },
            { name: "Matching", href: "/matching" },
            { name: "Chating", href: "/chating" },
            { name: "Dashboard", href: "/dashboard" },
            { name: "AI Chat Bot", href: "/chatbot" },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block text-gray-700 hover:text-purple-600 font-medium"
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
