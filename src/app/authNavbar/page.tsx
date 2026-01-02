"use client";
import Link from "next/link";
import { UserRound } from "lucide-react";

export default function AuthNavbar() {
  return (
    <nav className="w-full flex justify-between items-center px-6 py-4 bg-[#faf7f2] shadow-sm">
      <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-lg w-10 h-10 flex items-center justify-center rounded-full">
            S
          </div>
          <span className="text-lg font-semibold text-gray-800">Swap Skill</span>
        </div>


      <div className="flex items-center space-x-4">
        <button className="flex items-center space-x-1 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition text-sm">
          <UserRound size={16} />
          <span>Help</span>
        </button>

        <Link
          href="/signup"
          className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium px-4 py-1.5 rounded-lg shadow hover:bg-pink-600 transition text-sm"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
