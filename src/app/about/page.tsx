"use client";

import React from "react";
import Navbar from "@/app/components/innernavbar/page";
import Footer from "@/app/components/footer/page";
import Image from "next/image";
import { Target, Heart, Users, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="bg-gray-950 text-white">
      <Navbar />

      {/* HERO SECTION  */}
      <section className="relative py-28 px-6 text-center">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30"></div>

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-block mb-4 px-4 py-1 text-sm font-medium rounded-full bg-white/10 backdrop-blur">
            About Skill Swap
          </span>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Learn. Share. <span className="text-pink-300">Grow Together.</span>
          </h1>

          <p className="mt-6 text-lg text-white/80">
            Skill Swap is a collaborative platform where people exchange skills,
            build real experience, and grow together — without money barriers.
          </p>
        </div>
      </section>

      {/* IMAGE CARDS  */}
      <section className="relative -mt-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            "/About3 (1).jpg",
            "/About3 (2).jpg",
            "/About3 (3).jpg",
            "/About3 (4).jpg",
          ].map((img, index) => (
            <div
              key={index}
              className="group rounded-2xl overflow-hidden bg-white/10 backdrop-blur shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <Image
                src={img}
                alt="Skill Swap Community"
                width={400}
                height={300}
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </section>
      {/* HERO / WHY SKILLSWAP */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#f7f5ff] via-[#f3f7ff] to-[#eef6ff]">
        {/* Background Glow Blobs */}
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-purple-400/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -right-32 w-[420px] h-[420px] bg-blue-400/30 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-14 lg:gap-24">
            {/* LEFT CONTENT */}
            <div
              className="
    flex flex-col space-y-6
    text-center lg:text-left
    max-w-2xl mx-auto lg:mx-0
    lg:pl-16
  "
            >
              <span className="inline-block w-fit mx-auto  px-4 py-1 text-sm font-semibold rounded-full bg-pink-100 text-pink-600 uppercase tracking-wide">
                About SkillSwap
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-3xl font-extrabold text-gray-900 leading-tight">
                We’re a Global <br className="hidden sm:block" />
                Skill Exchange Platform
              </h1>

              <p className="max-w-xl mx-auto md:mx-0 text-gray-600 text-base md:text-lg leading-relaxed">
                SkillSwap connects learners and professionals to exchange
                <span className="font-semibold text-purple-600">
                  {" "}
                  real-world skills{" "}
                </span>
                without money. Learn faster, teach smarter, and grow together
                with AI-powered validation.
              </p>

              {/* STATS */}
              <div className="flex flex-wrap justify-center md:justify-center gap-10 pt-4">
                <div>
                  <p className="text-3xl font-bold text-gray-900">98%</p>
                  <p className="text-gray-500">User Satisfaction</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">1200+</p>
                  <p className="text-gray-500">Active Users</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">500+</p>
                  <p className="text-gray-500">Skills Swapped</p>
                </div>
              </div>
            </div>

            {/* RIGHT VISUAL */}
            <div
              className="
  hidden lg:flex
  relative justify-center items-center
  lg:-translate-x-12
"
            >
              {/* BLUE GRADIENT CIRCLE */}
              <div
                className="
          absolute
          w-[220px] h-[220px]
          sm:w-[280px] sm:h-[280px]
          md:w-[340px] md:h-[340px]
          lg:w-[380px] lg:h-[380px]
          rounded-full
          bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500
          opacity-90
        "
              />

              {/* GLOW */}
              <div
                className="
          absolute
          w-[420px] h-[420px]
          bg-blue-500/40
          blur-[140px]
          -z-10
        "
              />

              {/* IMAGE */}
              <img
                src="/girl.png"
                alt="SkillSwap Hero"
                className="
            relative
            w-72 sm:w-80 md:w-[420px] lg:w-[960px]
            object-contain
            z-10
          "
              />

              {/* Floating Badges */}
              <div className="absolute top-8 right-4 bg-white/90 backdrop-blur shadow-xl rounded-2xl px-4 py-2 text-sm font-semibold text-gray-700">
                ✅ AI Verified Skills
              </div>

              <div className="absolute bottom-8 left-4 bg-white/90 backdrop-blur shadow-xl rounded-2xl px-4 py-2 text-sm font-semibold text-gray-700">
                🌍 Global Community
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIFFERENTIATORS */}
     <section className="py-24 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 relative overflow-hidden">
  {/* Subtle background glow */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.08),transparent_60%)] pointer-events-none" />

  <div className="relative max-w-7xl mx-auto px-6">
    <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
      What Makes SkillSwap Different
    </h2>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {[
        {
          icon: Target,
          title: "Smart Matching",
          desc: "AI connects the right learners and teachers",
        },
        {
          icon: Users,
          title: "Peer-to-Peer",
          desc: "Direct learning without middlemen",
        },
        {
          icon: Globe,
          title: "Global Reach",
          desc: "Learn from anywhere in the world",
        },
        {
          icon: Heart,
          title: "Community First",
          desc: "Growth through collaboration",
        },
      ].map((item, i) => (
        <div
          key={i}
          className="
            group relative p-8 rounded-3xl
            bg-white/10 backdrop-blur-xl
            border-2 border-transparent
            shadow-[0_8px_40px_rgba(0,0,0,0.05)]
            transition-all duration-500
            hover:-translate-y-3
            hover:shadow-[0_0_60px_rgba(236,72,153,0.3)]
            hover:border-pink-400/50
          "
        >
          {/* Neon Glow */}
          <div className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse
                          bg-gradient-to-tr from-pink-500/30 via-purple-500/30 to-blue-500/30 blur-3xl" />

          {/* Icon Container */}
          <div className="relative z-10 flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full
                          bg-gradient-to-tr from-pink-400/20 via-purple-400/20 to-blue-400/20
                          shadow-lg shadow-pink-300/30
                          group-hover:scale-125 transition-transform duration-500">
            <item.icon className="w-10 h-10 text-pink-500 group-hover:text-pink-600 transition-colors duration-300" />
          </div>

          {/* Content */}
          <h3 className="relative z-10 text-xl font-bold text-center text-gray-900 group-hover:text-pink-500 transition-colors duration-300">
            {item.title}
          </h3>
          <p className="relative z-10 text-gray-700/90 text-sm text-center mt-2 leading-relaxed">
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>


      <Footer />
    </main>
  );
}
