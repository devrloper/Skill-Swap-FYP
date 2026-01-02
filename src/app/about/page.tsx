"use client";

import React from "react";
import Navbar from "@/app/components/Navbar/page";
import Footer from "@/app/components/footer/page";
import Image from "next/image"
import {
  Target,
  Heart,
  Users,
  Globe,
  CheckCircle,
} from "lucide-react";

export default function AboutPage() {
  return (
    <main className="bg-gray-950 text-white">
      <Navbar />

     {/* ================= HERO SECTION ================= */}
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

      {/* ================= IMAGE CARDS ================= */}
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
      {/* ================= WHY SKILLSWAP ================= */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">
              Why SkillSwap Exists
            </h2>
            <p className="text-white/70 text-lg mb-6">
              Education is expensive. Talent is everywhere.
              <br /><br />
              SkillSwap removes barriers by allowing people to exchange
              real-world skills instead of money.
            </p>
            <p className="text-white/60">
              If you have knowledge — you already have value.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              "No paid courses",
              "Skill-for-skill exchange",
              "AI verified professionals",
              "Global learning community",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-6 py-4"
              >
                <CheckCircle className="text-pink-400" />
                <span className="text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= DIFFERENTIATORS ================= */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">
            What Makes SkillSwap Different
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
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
                className="text-center p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-pink-500/40 transition"
              >
                <item.icon className="w-10 h-10 mx-auto text-pink-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {item.title}
                </h3>
                <p className="text-white/60 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CORE VALUES ================= */}
      <section className="py-24 bg-gradient-to-br from-purple-950 to-gray-950">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-16">
            Our Core Values
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Accessibility",
                desc: "Learning should not depend on money.",
              },
              {
                title: "Trust",
                desc: "AI verification ensures real skills.",
              },
              {
                title: "Empowerment",
                desc: "Everyone has something valuable to teach.",
              },
            ].map((v, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              >
                <h3 className="text-xl font-semibold text-pink-400 mb-3">
                  {v.title}
                </h3>
                <p className="text-white/70">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-24 bg-gradient-to-r from-pink-600 to-purple-600 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
          Start Swapping Skills Today
        </h2>
        <p className="text-white/90 mb-10 text-lg">
          Join a community where skills matter more than money.
        </p>
        <a
          href="/signup"
          className="inline-block bg-white text-gray-900 px-10 py-4 rounded-full font-semibold hover:scale-105 transition"
        >
          Join SkillSwap Free
        </a>
      </section>

      <Footer />
    </main>
  );
}
