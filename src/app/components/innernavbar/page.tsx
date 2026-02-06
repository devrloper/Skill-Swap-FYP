"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import Modal from "@/app/Modals/profilemodal/page";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import type { User } from "firebase/auth";
import Button from "@/app/ui/button";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);
  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/signin");
  };

  const navLinkClass =
    "relative text-gray-700 hover:text-purple-600 transition font-medium after:absolute after:left-1/2 after:-bottom-1 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-purple-600 after:to-pink-500 after:transition-all after:duration-300 hover:after:w-full hover:after:left-0";

  return (
    <>
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
            <Link href="/home" className={navLinkClass}>
              Home
            </Link>
            <Link href="/about" className={navLinkClass}>
              About
            </Link>
            <Link href="/trendingskills" className={navLinkClass}>
              Trending Skills
            </Link>
            <Link href="/matching" className={navLinkClass}>
              Matching
            </Link>
            <Link href="/chating" className={navLinkClass}>
              Chating
            </Link>
            <Link href="/chatbot" className={navLinkClass}>
              AI Chat Bot
            </Link>
            <Link href="/dashboard" className={navLinkClass}>
              Dashboard
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="ml-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-full font-semibold shadow-md hover:brightness-105 transition cursor-pointer"
            >
              Enroll Now
            </button>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Notifications */}
            <button className="relative ">
              <Bell className="w-6 h-6 text-gray-700 hover:text-purple-600 transition cursor-pointer" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            {/* User Avatar & Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-300 focus:outline-none"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-semibold uppercase">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                  </div>
                )}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white shadow-xl rounded-lg border border-gray-200 z-50 animate-fade-in">
                  <div className="flex flex-col items-center gap-2 p-4 border-b border-gray-100">
                    {user?.photoURL ? (
                      // Show user image if available
                      <img
                        src={user.photoURL}
                        alt="User"
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      // Fallback: show initials if no image
                      <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-lg uppercase">
                        {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                      </div>
                    )}
                    <p className="font-semibold text-gray-800 text-center truncate">
                      {user?.displayName || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate text-center">
                      {user?.email}
                    </p>
                  </div>

                  <Button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-gray-700"
                  >
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right Section */}
          <div className="flex items-center gap-3 lg:hidden">
            <button className="relative ">
              <Bell className="w-6 h-6 text-gray-700 cursor-pointer" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
            <div className="relative w-9 h-9">
              {user?.photoURL ? (
                //  Google Sign-in Image
                <img
                  src={user.photoURL}
                  alt="User"
                  className="w-9 h-9 rounded-full object-cover border border-gray-300"
                />
              ) : (
                // ✅ Email Signup → First Letter
                <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold uppercase">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                </div>
              )}

              {/* Online Status */}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />

              {/* Dropdown */}
              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white shadow-xl rounded-lg border border-gray-200 z-50"
                  onMouseLeave={() => setProfileOpen(false)}
                >
                  <div className="flex flex-col items-center gap-2 p-4 border-b border-gray-100">
                    <img
                      src={user?.photoURL || ""}
                      alt="User"
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <p className="font-semibold text-gray-800 text-center truncate">
                      {user?.displayName || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate text-center">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-gray-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden bg-white/90 backdrop-blur-md border-t border-gray-200 h-screen flex flex-col items-center space-y-4 pt-6 px-6">
            {/* Mobile / Tablet Links */}
            <Link
              href="/"
              className="block text-gray-700 hover:text-purple-600 font-medium text-lg sm:text-xl md:text-2xl"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="block text-gray-700 hover:text-purple-600 font-medium text-lg sm:text-xl md:text-2xl"
            >
              About
            </Link>
            <Link
              href="/matching"
              className="block text-gray-700 hover:text-purple-600 font-medium text-lg sm:text-xl md:text-2xl"
            >
              Matching
            </Link>
            <Link
              href="/chating"
              className="block text-gray-700 hover:text-purple-600 font-medium text-lg sm:text-xl md:text-2xl"
            >
              Chating
            </Link>
            <Link
              href="/dashboard"
              className="block text-gray-700 hover:text-purple-600 font-medium text-lg sm:text-xl md:text-2xl"
            >
              Dashboard
            </Link>
            <Link
              href="/chatbot"
              className="block text-gray-700 hover:text-purple-600 font-medium text-lg sm:text-xl md:text-2xl"
            >
              AI Chat Bot
            </Link>

            {/* Enroll Now Button for mobile/tablet */}
            <button
              onClick={() => setOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-full font-semibold shadow-md hover:brightness-105 transition cursor-pointer text-sm sm:text-base md:text-lg mt-4"
            >
              Enroll Now
            </button>
          </div>
        )}
      </header>
      <Modal open={open} setOpen={setOpen} />
    </>
  );
}
