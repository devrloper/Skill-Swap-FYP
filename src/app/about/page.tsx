"use client";

import React from "react";
import Navbar from "@/app/components/innernavbar/page";
import Footer from "@/app/components/footer/page";
import Image from "next/image";
import { Target, Heart, Users, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
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
            Learn. Share. <span className="text-pink-300">Grow Together.</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg text-white/80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Skill Swap is a collaborative platform where people exchange skills,
            build real experience, and grow together — without money barriers.
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

      {/* DIFFERENTIATORS */}
      <section className="py-24 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.08),transparent_60%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.h2
            className="text-4xl font-bold text-center mb-16 text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, amount: 0.3 }}
          >
            What Makes SkillSwap Different
          </motion.h2>

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
              <motion.div
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
                viewport={{ once: false, amount: 0.3 }}
              >
                <div
                  className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse
                          bg-gradient-to-tr from-pink-500/30 via-purple-500/30 to-blue-500/30 blur-3xl"
                />
                <div
                  className="relative z-10 flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full
                          bg-gradient-to-tr from-pink-400/20 via-purple-400/20 to-blue-400/20
                          shadow-lg shadow-pink-300/30
                          group-hover:scale-125 transition-transform duration-500"
                >
                  <item.icon className="w-10 h-10 text-pink-500 group-hover:text-pink-600 transition-colors duration-300" />
                </div>
                <h3 className="relative z-10 text-xl font-bold text-center text-gray-900 group-hover:text-pink-500 transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="relative z-10 text-gray-700/90 text-sm text-center mt-2 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
