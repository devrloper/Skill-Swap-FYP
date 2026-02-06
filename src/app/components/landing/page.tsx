"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import Modal from "@/app/Modals/profilemodal/page";

export default function HeroSection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="bg-[#fdf4ff] min-h-screen flex flex-col-reverse lg:flex-row items-center justify-center px-6 sm:px-10 lg:px-20 py-10">
        
        {/* LEFT CONTENT */}
        <motion.div
          className="w-full lg:w-1/2 text-center lg:text-left space-y-6 mt-10 lg:mt-0"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: false }}
        >
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            viewport={{ once: false }}
          >
            Develop your skills in a new and unique way
          </motion.h1>

          <motion.p
            className="text-gray-600 text-sm sm:text-base md:text-lg max-w-md mx-auto lg:mx-0"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            viewport={{ once: false }}
          >
            Choose a better future. Upgrade your skills and become the person
            you&apos;ve always wanted to be. Our unique approach to online
            education helps you succeed.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            viewport={{ once: false }}
          >
            <motion.button
              onClick={() => setOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-950 cursor-pointer to-pink-600 text-white px-6 py-3 rounded-full font-medium shadow-md hover:opacity-90 transition-all"
            >
              Enroll Now
            </motion.button>

            <motion.button
              whileHover={{ x: 6 }}
              className="text-pink-600 font-medium flex items-center justify-center space-x-1 hover:underline"
            >
              <span>More Details</span>
              <span>→</span>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* RIGHT IMAGE */}
        <motion.div
          className="w-full lg:w-1/2 flex justify-center relative"
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          viewport={{ once: false }}
        >
          <motion.div
            className="relative w-72 sm:w-80 md:w-96"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <Image
              src="/Landing_1.png"
              alt="Student learning online"
              width={400}
              height={400}
              className="object-contain rounded-xl w-full h-auto"
              priority
            />
          </motion.div>
        </motion.div>
      </section>

      <Modal open={open} setOpen={setOpen} />
    </>
  );
}
