"use client";
import { useState } from "react";
import Navbar from "@/app/components/navbar/page";
import Landing from "@/app/components/landing/page";
import Image from "next/image";
import Footer from "@/app/components/footer/page";
import { motion } from "framer-motion";
import Link from "next/link";
import About from "@/app/components/about/page";
export default function Home() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Why we are?",
      answer:
        "We are committed to providing innovative IT solutions that empower businesses to grow faster, smarter, and more efficiently.",
    },
    {
      question: "What we do for you?",
      answer:
        "We deliver end-to-end digital transformation services — from web development to cloud infrastructure and cybersecurity.",
    },
    {
      question: "100% data security",
      answer:
        "Your data is protected with enterprise-level encryption and robust access controls ensuring complete privacy.",
    },
  ];
  return (
    <div>
      <Navbar />
      <Landing />

      {/* About Us Section */}
      <About />

      {/* Work process */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-pink-50 relative overflow-hidden">
        {/* Background Gradient Blobs */}
        <div className="absolute -top-32 -left-20 w-72 h-72 bg-purple-900 opacity-30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-20 w-80 h-80 bg-pink-300 opacity-30 rounded-full blur-3xl animate-pulse"></div>

        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          {/* Title */}
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 font-semibold mb-3 uppercase tracking-wide">
            Our Work Process
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            Our Proven{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
              Work Process
            </span>
          </h2>

          <p className="max-w-2xl mx-auto text-gray-500 text-sm md:text-base mt-4 mb-16">
            We follow a structured, proven process to ensure quality
            collaboration, learning, and growth for every Skill Swap member.
          </p>

          {/* Process Steps */}
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-12 md:gap-6">
            {/* Connecting Line (background) */}
            <div className="hidden md:block absolute top-[48px] left-0 right-0 mx-auto h-[3px] bg-gradient-to-r from-purple-600 to-pink-500 w-[85%]"></div>

            {/* Moving Dot Animation */}
            <div className="hidden md:block absolute top-[40px] left-[7.5%] w-4 h-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 animate-moveDot shadow-lg shadow-pink-400"></div>

            {/* Step 1 */}
            <div
              className="flex flex-col items-center text-center flex-1 z-10 fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-[2px] lg:mr-6 rounded-full mb-4 transition-transform duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-300/50">
                <div className="bg-white p-6 rounded-full">💬</div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                Consultation
              </h3>
              <p className="text-gray-600 text-sm max-w-xs">
                Discuss your goals and what you want to learn or teach.
              </p>
            </div>

            {/* Step 2 */}
            <div
              className="flex flex-col items-center text-center flex-1 z-10 fade-up"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-[2px]  rounded-full mb-4 transition-transform duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-300/50">
                <div className="bg-white p-6 rounded-full">🧠</div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                Strategy
              </h3>
              <p className="text-gray-600 text-sm max-w-xs">
                We match your skills with people who complement your interests.
              </p>
            </div>

            {/* Step 3 */}
            <div
              className="flex flex-col items-center text-center flex-1 z-10 fade-up"
              style={{ animationDelay: "0.6s" }}
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-[2px] rounded-full mb-4 transition-transform duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-300/50">
                <div className="bg-white p-6 rounded-full">⚙️</div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                Implementation
              </h3>
              <p className="text-gray-600 text-sm max-w-xs">
                Connect, communicate, and start exchanging skills effectively.
              </p>
            </div>

            {/* Step 4 */}
            <div
              className="flex flex-col items-center text-center flex-1 z-10 fade-up"
              style={{ animationDelay: "0.8s" }}
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-[2px] lg:ml-6 rounded-full mb-4 transition-transform duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-300/50">
                <div className="bg-white p-6 rounded-full">🎯</div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                Final Result
              </h3>
              <p className="text-gray-600 text-sm max-w-xs">
                Achieve new skills, grow together, and expand your network.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* trendingskills */}
      <section className="relative w-full text-white overflow-hidden">
        {/* Fixed (sticky) background image */}
        <div
          className="absolute inset-0 bg-fixed bg-center bg-cover opacity-40"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=1500&q=80')",
          }}
        ></div>

        {/* Overlay content */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-20 md:py-28 space-y-6 md:space-y-0 bg-black/40 ">
          {/* Left Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center md:text-left max-w-2xl"
          >
            <p className="text-sm tracking-widest text-purple-400 mb-2">
              🔥 DISCOVER WITH AI
            </p>
            <h2 className="text-3xl md:text-5xl font-bold leading-snug">
              Explore the Top Trending Skills of 2025
            </h2>
            <p className="mt-4 text-gray-300 text-base md:text-lg">
              Get AI-generated insights on which tech skills are in demand —
              updated weekly to keep your knowledge ahead of the curve.
            </p>
          </motion.div>

          {/* Right Button */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/trendingskills">
              <button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition-opacity text-white px-8 py-3 rounded-lg font-semibold shadow-lg">
                Explore by AI →
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
      {/* FAq's */}
      <section className="relative py-16 px-6 md:px-12 lg:px-20 flex flex-col lg:flex-row items-center justify-between bg-white">
        {/* ===== LEFT CONTENT ===== */}
        <div className="w-full lg:w-1/2 space-y-5">
          <p className="text-pink-600 font-semibold uppercase tracking-wide text-3xl">
            Faq
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-snug">
            Know more about our <br /> IT solution
          </h2>
          <p className="text-gray-500 text-base md:text-lg">
            Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper
            libero sit amet adipiscing neque.
          </p>

          {/* ===== ACCORDION ===== */}
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-blue-50 rounded-lg shadow-sm overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full flex justify-between items-center text-left px-5 py-4 font-semibold text-gray-800 focus:outline-none"
                >
                  {faq.question}
                  <span className="text-xl text-gray-600">
                    {openIndex === index ? "−" : "+"}
                  </span>
                </button>
                {openIndex === index && (
                  <div className="px-5 pb-4 text-gray-600 text-sm md:text-base">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ===== RIGHT IMAGE ===== */}
        <div className="relative mt-10 lg:mt-0 lg:w-1/2 flex justify-center">
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px] lg:w-[480px] lg:h-[480px]">
            {/* Background circle */}
            <div className="absolute inset-0 rounded-full -z-10"></div>

            {/* FAQ image */}
            <Image
              src="/FAQ.png"
              alt="FAQ illustration"
              fill
              className="object-contain"
            />

            {/* Animated question mark */}
            <div className="absolute top-6 left-25 sm:left-25 text-black text-5xl sm:text-6xl md:text-7xl  lg:text-8xl font-bold animate-bounce">
              ?
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
