"use client";
import { useState, useEffect } from "react";
import Navbar from "@/app/components/innernavbar/page";
import Landing from "@/app/components/landing/page";
import Image from "next/image";
import Footer from "@/app/components/footer/page";
import Link from "next/link";
import About from "@/app/components/about/page";
import ChipLoader from "@/app/components/loader/page";
import { motion, AnimatePresence } from "framer-motion";
import Msgarea from "@/app/components/msgareahome/page";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MessageSquare,
  X,
  Send,
  Paperclip,
  Smile,
  Mic,
  Sparkle,
} from "lucide-react";
export default function Home() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 1. Add loading state

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
  //  Simulate loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // 2.5 seconds - adjust as needed
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
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: false, amount: 0.3 }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 font-semibold mb-3 uppercase tracking-wide"
            >
              Our Work Process
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: false, amount: 0.3 }}
              className="text-3xl md:text-4xl font-bold text-gray-800"
            >
              Our Proven{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                Work Process
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: false, amount: 0.3 }}
              className="max-w-2xl mx-auto text-gray-500 text-sm md:text-base mt-4 mb-16"
            >
              We follow a structured, proven process to ensure quality
              collaboration, learning, and growth for every Skill Swap member.
            </motion.p>

            {/* Process Steps */}
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-12 md:gap-6">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-[48px] left-0 right-0 mx-auto h-[3px] bg-gradient-to-r from-purple-600 to-pink-500 w-[85%]"></div>

              {/* Moving Dot */}
              <div className="hidden md:block absolute top-[40px] left-[7.5%] w-4 h-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 animate-moveDot shadow-lg shadow-pink-400"></div>

              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: false, amount: 0.3 }}
                className="flex flex-col items-center text-center flex-1 z-10"
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
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                viewport={{ once: false, amount: 0.3 }}
                className="flex flex-col items-center text-center flex-1 z-10"
              >
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-[2px] rounded-full mb-4 transition-transform duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-300/50">
                  <div className="bg-white p-6 rounded-full">🧠</div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                  Strategy
                </h3>
                <p className="text-gray-600 text-sm max-w-xs">
                  We match your skills with people who complement your
                  interests.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: false, amount: 0.3 }}
                className="flex flex-col items-center text-center flex-1 z-10"
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
              </motion.div>

              {/* Step 4 */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
                viewport={{ once: false, amount: 0.3 }}
                className="flex flex-col items-center text-center flex-1 z-10"
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
              </motion.div>
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
              <div className="flex items-center gap-2 bg-gradient-to-r  text-pink-900 font-bold text-2xl">
                <Sparkle size={30} />
                <span>DISCOVER WITH AI</span>
              </div>
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
                <button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition-all duration-300 text-white px-4 sm:px-6 md:px-5 lg:px-8 py-2 sm:py-2.5 md:py-2 lg:py-3 text-sm sm:text-base md:text-sm lg:text-base rounded-full font-semibold shadow-lg w-full sm:w-auto whitespace-nowrap">
                  Explore by AI →
                </button>
              </Link>
            </motion.div>
          </div>
        </section>
        {/* FAQ */}
        <section className="relative py-16 px-6 lg:px-20 flex flex-col lg:flex-row items-center justify-between bg-white overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, amount: 0.3 }}
            className="w-full lg:w-1/2 space-y-5"
          >
            <p className="text-pink-600 font-semibold uppercase text-3xl">
              Faq
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Know more about our <br /> IT solution
            </h2>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-blue-50 rounded-lg shadow">
                  <button
                    onClick={() =>
                      setOpenIndex(openIndex === index ? null : index)
                    }
                    className="w-full flex justify-between px-5 py-4 font-semibold"
                  >
                    {faq.question}
                    <span>{openIndex === index ? "−" : "+"}</span>
                  </button>
                  {openIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="px-5 pb-4 text-gray-600"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* FAQ IMAGE */}
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, amount: 0.3 }}
            className="relative mt-10 lg:mt-0 lg:w-1/2 flex justify-center"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="relative w-80 h-80 md:w-[420px] md:h-[420px]"
            >
              <Image src="/FAQ.png" alt="FAQ" fill className="object-contain" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute top-6 left-24 text-6xl font-bold"
              >
                ?
              </motion.div>
            </motion.div>
          </motion.div>

          <Msgarea />
        </section>
        <Footer />
      </div>
    </>
  );
}
