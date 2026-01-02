import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

export default function AboutUs() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const points = [
    {
      title: "Skill Exchange Platform",
      text: "Connect with learners and experts to trade skills effortlessly.",
    },
    {
      title: "Expert-Led Learning",
      text: "Learn directly from skilled individuals passionate about teaching.",
    },
    {
      title: "Grow Together",
      text: "Empower yourself and others through collaboration and shared knowledge.",
    },
    {
      title: "Community Driven",
      text: "Join a supportive network built on mutual growth and respect.",
    },
  ];

  return (
    <section className="py-16 px-6 md:px-12 lg:px-24 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center gap-10">
        {/* Left Content */}
        <div className="w-full md:w-1/2 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            About Us
          </h1>
          <p className="text-gray-600 mb-10 leading-relaxed">
            Skill Swap is a community-driven platform where people come together
            to share knowledge, learn new abilities, and grow together — one
            skill at a time.
          </p>

          {/* ==== Simple Gradient Points for Mobile/Tablet ==== */}
          <div className="block lg:hidden space-y-6">
            {points.map((point, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-start sm:gap-4 text-center sm:text-left">
                {/* Gradient Number Box */}
                <div className="mx-auto sm:mx-0 mb-3 sm:mb-0 w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-lg shadow-md">
                  {index + 1}
                </div>

                {/* Text Content */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1 text-lg">
                    {point.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {point.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ==== Box Style Only for Laptop/Desktop ==== */}
          <div className="hidden lg:grid grid-cols-2 gap-6">
            {points.map((point, index) => (
              <motion.div
                key={index}
                onClick={() => setActiveIndex(index)}
                onHoverStart={() => setActiveIndex(index)}
                className={`relative cursor-pointer rounded-2xl border p-6 transition-all duration-300 shadow-sm bg-white ${
                  activeIndex === index
                    ? "border-purple-400 shadow-lg"
                    : "border-gray-200 hover:border-purple-300 hover:shadow-md"
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeIndex === index && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 opacity-70"
                    transition={{ type: "spring", stiffness: 250, damping: 25 }}
                  />
                )}

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold mb-3 mx-auto lg:mx-0">
                    {index + 1}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                    {point.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {point.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Image */}
        <div className="w-full md:w-1/2 flex justify-center">
          <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
            <Image
              src="/Aboutimg.png"
              alt="About Skill Swap"
              width={800}
              height={600}
              className="w-full h-auto rounded-2xl object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
