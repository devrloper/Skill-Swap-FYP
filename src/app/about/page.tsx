"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/app/components/innernavbar/page";
import Footer from "@/app/components/footer/page";
import Image from "next/image";
import { Target, Heart, Users, Globe } from "lucide-react";
import ChipLoader from "@/app/components/loader/page";
import { motion, AnimatePresence } from "framer-motion";
export default function AboutPage() {
  const [isLoading, setIsLoading] = useState(true);
  const features = [
    {
      icon: Target,
      title: "Smart Matching",
      desc: "AI-driven algorithms to connect you with the perfect skill partners.",
      color: "from-blue-500 to-cyan-400",
    },
    {
      icon: Users,
      title: "Peer-to-Peer",
      desc: "Direct knowledge exchange, breaking the traditional classroom barriers.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Globe,
      title: "Global Reach",
      desc: "Join a borderless community of experts and learners worldwide.",
      color: "from-orange-400 to-rose-500",
    },
    {
      icon: Heart,
      title: "Community First",
      desc: "Built on trust, collaboration, and a shared passion for growth.",
      color: "from-emerald-400 to-teal-500",
    },
  ];
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          >
            <div className="w-full max-w-md">
              <ChipLoader />
            </div>
          </motion.div>
        )}
      </AnimatePresence>{" "}
      <main className="bg-gray-950 text-white">
        <Navbar />

        {/* HERO SECTION */}
        <section className="relative py-28 px-6 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30"></div>

          <motion.div
            className="relative z-10 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.span
              className="inline-block mb-4 px-4 py-1 text-sm font-medium rounded-full bg-white/10 backdrop-blur"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              About Skill Swap
            </motion.span>

            <motion.h1
              className="text-4xl md:text-6xl font-extrabold leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Learn. Share.{" "}
              <span className="text-pink-300">Grow Together.</span>
            </motion.h1>

            <motion.p
              className="mt-6 text-lg text-white/80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Skill Swap is a collaborative platform where people exchange
              skills, build real experience, and grow together — without money
              barriers.
            </motion.p>
          </motion.div>
        </section>

        {/* IMAGE CARDS */}
        <section className="relative -mt-20 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              "/About3 (1).jpg",
              "/About3 (2).jpg",
              "/About3 (3).jpg",
              "/About3 (4).jpg",
            ].map((img, index) => (
              <motion.div
                key={index}
                className="group rounded-2xl overflow-hidden bg-white/10 backdrop-blur shadow-xl hover:-translate-y-2 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Image
                  src={img}
                  alt="Skill Swap Community"
                  width={400}
                  height={300}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </motion.div>
            ))}
          </div>
        </section>

        {/* HERO / WHY SKILLSWAP */}
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#f7f5ff] via-[#f3f7ff] to-[#eef6ff]">
          <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-purple-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 -right-32 w-[420px] h-[420px] bg-purple-400 rounded-full blur-[120px]" />

          <div className="relative max-w-7xl mx-auto px-6 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-14 lg:gap-24">
              <motion.div
                className="flex flex-col space-y-6 text-center lg:text-left max-w-2xl mx-auto lg:mx-0 lg:pl-16"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.8 }}
              >
                <motion.span
                  className="inline-block w-fit mx-auto lg:mx-0 px-4 py-1 text-sm font-semibold rounded-full bg-pink-100 text-pink-600 uppercase tracking-wide"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: false, amount: 0.3 }}
                >
                  About SkillSwap
                </motion.span>

                <motion.h1
                  className="text-3xl sm:text-4xl md:text-5xl xl:text-4xl font-extrabold text-gray-900 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: false, amount: 0.3 }}
                >
                  We’re a Global <br className="hidden sm:block" />
                  Skill Exchange Platform
                </motion.h1>

                <motion.p
                  className="max-w-xl mx-auto lg:mx-0 text-gray-600 text-base md:text-lg leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: false, amount: 0.3 }}
                >
                  SkillSwap connects learners and professionals to exchange
                  <span className="font-semibold text-purple-600">
                    {" "}
                    real-world skills{" "}
                  </span>
                  without money. Learn faster, teach smarter, and grow together
                  with AI-powered validation.
                </motion.p>

                <motion.div
                  className="flex flex-wrap justify-center lg:justify-start gap-10 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: false, amount: 0.3 }}
                >
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
                </motion.div>
              </motion.div>

              <motion.div
                className="hidden lg:flex relative justify-center items-center lg:-translate-x-6"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: false, amount: 0.3 }}
              >
                <img
                  src="/homeimg.png"
                  alt="SkillSwap Hero"
                  className="relative w-80 sm:w-96 md:w-[500px] lg:w-[1400px] object-contain z-10 right-14"
                />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative py-24 overflow-hidden bg-[#ffffff]">
          {/* --- IMAGE-STYLE GLOWY BACKGROUND --- */}
          {/* Top Right Pink Glow */}
          <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-gradient-to-br from-pink-300/40 to-purple-400/30 rounded-full blur-[100px] -z-10 animate-pulse" />

          {/* Middle Purple Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(219,39,119,0.08),transparent_70%)] -z-10" />

          {/* Bottom Left Cyan/Blue Glow */}
          <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-200/40 to-blue-300/30 rounded-full blur-[120px] -z-10" />

          <div className="relative max-w-7xl mx-auto px-6">
            {/* --- HEADER WITH BLUR ANIMATION --- */}
            <div className="text-center mb-20">
              <motion.span
                initial={{ opacity: 0, letterSpacing: "0.1em" }}
                whileInView={{ opacity: 1, letterSpacing: "0.2em" }}
                className="text-pink-600 font-bold uppercase text-xs tracking-[0.2em] bg-pink-50 px-4 py-1.5 rounded-full"
              >
                Why Choose Us
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-6 tracking-tight"
              >
                What Makes SkillSwap Different
              </motion.h2>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "80px" }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 mx-auto mt-6 rounded-full shadow-lg shadow-pink-200"
              />
            </div>

            {/* --- RESPONSIVE GRID WITH STAGGERED ANIMATION --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.15,
                    type: "spring",
                    stiffness: 100,
                  }}
                  viewport={{ once: true }}
                  whileHover={{ y: -15 }}
                  className="group relative bg-white/70 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(147,51,234,0.35)] hover:shadow-[0_30px_60px_rgba(168,85,247,0.45)] transition-all duration-500"
                >
                  {/* Icon Box with Floating Animation */}
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-8 shadow-lg transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300`}
                  >
                    <item.icon className="w-8 h-8 text-white" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-pink-600 transition-colors duration-300">
                    {item.title}
                  </h3>

                  <p className="text-slate-600 leading-relaxed text-sm group-hover:text-slate-900 transition-colors duration-300">
                    {item.desc}
                  </p>

                  {/* Glowing Corner Decoration */}
                  <div
                    className={`absolute -bottom-2 -right-2 w-20 h-20 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-500 rounded-full`}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
