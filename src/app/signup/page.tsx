import React from "react";
import { FaFacebook, FaTwitter, FaUser, FaRegEye } from "react-icons/fa";

export default function SignupPage() {
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#F0F4F8] font-sans overflow-hidden">
      {/* 1. BACKGROUND IMAGE LAYER */}
      <div className="absolute inset-0 z-0">
        <img
          src="/signup.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* 2. LOGIN CARD CONTAINER */}
      <div className="relative z-10 w-full max-w-7xl px-4 flex justify-center md:justify-end items-center">
        {/* Compact Create Account Card */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-500 w-full max-w-[350px] sm:max-w-[380px] aspect-[4/5] rounded-[35px] shadow-2xl flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 transform transition-transform hover:scale-[1.01] lg:-translate-x-30 opacity-85">
          <h2 className="text-[#0A1144] text-xl sm:text-2xl font-bold mb-6 sm:mb-8 tracking-tight text-center">
            Create Account
          </h2>

          <form className="w-full space-y-3 sm:space-y-4">
            {/* Full Name */}
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
              <input
                type="text"
                placeholder="Full Name"
                className="w-full py-2.5 sm:py-3 pl-10 pr-3 rounded-full border-none focus:ring-2 focus:ring-[#0A1144] outline-none shadow-inner text-xs sm:text-sm bg-white"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
              <input
                type="email"
                placeholder="Email"
                className="w-full py-2.5 sm:py-3 pl-10 pr-3 rounded-full border-none focus:ring-2 focus:ring-[#0A1144] outline-none shadow-inner text-xs sm:text-sm bg-white"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <FaRegEye className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
              <input
                type="password"
                placeholder="Password"
                className="w-full py-2.5 sm:py-3 pl-10 pr-3 rounded-full border-none focus:ring-2 focus:ring-[#0A1144] outline-none shadow-inner text-xs sm:text-sm bg-white"
              />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <FaRegEye className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full py-2.5 sm:py-3 pl-10 pr-3 rounded-full border-none focus:ring-2 focus:ring-[#0A1144] outline-none shadow-inner text-xs sm:text-sm bg-white"
              />
            </div>

            {/* Create Account Button */}
            <button className="w-full bg-[#0A1144] text-white py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base shadow-lg hover:bg-black transition-all active:scale-95 mt-3 sm:mt-4">
              Create Account
            </button>
          </form>

          {/* Social Icons */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-[10px] sm:text-[12px] text-[#0A1144] mb-3 italic font-bold opacity-80">
              or sign up using
            </p>
            <div className="flex justify-center gap-3">
              <button className="bg-[#3b5998] text-white p-2 rounded-full hover:scale-110 transition shadow-md">
                <FaFacebook size={18} />
              </button>
              <button className="bg-[#1DA1F2] text-white p-2 rounded-full hover:scale-110 transition shadow-md">
                <FaTwitter size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
