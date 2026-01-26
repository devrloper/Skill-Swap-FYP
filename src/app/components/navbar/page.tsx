"use client";

import Image from "next/image";
import Navbar from "@/app/components/navbar/page";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden mt-18">

      {/* ===== Background Image ===== */}
      <Image
        src="/main.png"
        alt="Hero Background"
        fill
        priority
        className="object-cover"
      />

      {/* ===== Gradient Overlay ===== */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-950/80 to-pink-600/70"></div>

      {/* ===== Content ===== */}
      <div className="relative z-10">
        <Navbar />

        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* ================= LEFT CONTENT ================= */}
            <div className="space-y-6 text-center lg:text-left text-white">

              <span className="inline-block text-sm font-semibold bg-white/20 px-4 py-1 rounded-full">
                Online Learning Course
              </span>

              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                Online Education <br />
                <span className="bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
                  Feels Like Real Classroom
                </span>
              </h1>

              <p className="text-gray-200 max-w-lg mx-auto lg:mx-0">
                Get certified, gain job-ready skills, and enjoy a flexible learning
                experience from anywhere in the world.
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <button className="bg-gradient-to-r from-purple-950 to-pink-600 text-white px-6 py-3 rounded-lg font-medium shadow hover:opacity-90 transition">
                  Get Started
                </button>

                <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition">
                  Our Courses
                </button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-6">
                {[
                  "20k+ Online Courses",
                  "Lifetime Access",
                  "Community Support",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2"
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-950 to-pink-600 text-white font-bold">
                      ✓
                    </div>
                    <span className="text-sm text-gray-200">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ================= RIGHT IMAGE ================= */}
            <div className="relative flex justify-center">
              <Image
                src="/homeimg.png"
                alt="Student"
                width={920}
                height={920}
                priority
              />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
