"use client";
import React from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import Link from "next/link";
export default function Footer() {
  return (
    <footer className="relative text-white">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center brightness-75"
        style={{ backgroundImage: "url('/study.png')" }}
      ></div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-700/80 via-purple-600/70 to-pink-500/70"></div>

      {/* Footer Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 space-y-16">
        {/* Newsletter Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Subscribe to our Newsletter
            </h2>
            <p className="text-white/80 text-sm md:text-base">
              Get the latest updates on Skill Swap projects and AI interviews
              directly in your inbox.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="email"
              placeholder="Your email"
              className="px-4 py-2 rounded-full w-full sm:w-auto text-gray-800 outline-none border-amber-50 border-2"
            />
            <button className="bg-pink-500 hover:bg-pink-600 transition px-6 py-2 rounded-full font-semibold text-white">
              Subscribe
            </button>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-center md:text-left">
          {/* Logo & Description */}
          <div className="flex flex-col gap-4 items-center md:items-start">
            <h1 className="text-3xl font-bold text-white">SkillSwap</h1>
            <p className="text-white/80 text-sm md:text-base">
              Connect professionals, exchange skills, and grow your expertise
              with SkillSwap.
            </p>
            <div className="flex gap-3 mt-2">
              <Link
                href="#"
                className="w-10 h-10 bg-pink-600 hover:bg-pink-700 rounded-full flex items-center justify-center text-white font-bold transition"
              >
                <FaFacebookF size={18} />
              </Link>
              <Link
                href="#"
                className="w-10 h-10 bg-pink-500 hover:bg-pink-600 rounded-full flex items-center justify-center text-white font-bold transition"
              >
                <FaTwitter size={18} />
              </Link>
              <Link
                href="#"
                className="w-10 h-10 bg-pink-500 hover:bg-pink-600 rounded-full flex items-center justify-center text-white font-bold transition"
              >
                <FaLinkedinIn size={18} />
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Navigation
            </h3>
            <ul className="space-y-2 text-white/80">
              <li>
                <a href="#" className="hover:text-white transition">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Profiles
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Skills
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  AI Interviews
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Quick Links
            </h3>
            <ul className="space-y-2 text-white/80">
              <li>
                <a href="#" className="hover:text-white transition">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Work Hours / Contact */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Work Hours
            </h3>
            <p className="text-white/80 mb-4 text-sm md:text-base">
              Mon - Fri: 9 AM - 6 PM <br />
              Sat: 10 AM - 4 PM
            </p>
            <button className="bg-pink-500 hover:bg-pink-600 transition px-6 py-2 rounded-full font-semibold text-white">
              Call Us
            </button>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-white/20 pt-6 text-center text-white/70 text-sm md:text-base">
          &copy; {new Date().getFullYear()} SkillSwap. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
