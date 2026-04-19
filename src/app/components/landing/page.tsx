"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Modal from "@/app/Modals/profilemodal/page";
import { auth, db } from "@/app/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function HeroSection() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setIsEnrolled(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        const data = snap.exists() ? snap.data() : null;
        const enrolled =
          Boolean(data?.enrolled) ||
          Boolean(data?.profileCompleted) ||
          Boolean(data?.interviewStatus) ||
          Boolean(data?.interviewScore) ||
          (Array.isArray(data?.completedSteps) &&
            data.completedSteps.includes(4));
        if (!cancelled) setIsEnrolled(enrolled);
      } catch (err) {
        console.error("Failed to check enrollment:", err);
        if (!cancelled) setIsEnrolled(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

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
            {!isEnrolled && (
              <motion.button
                onClick={() => setOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-950 cursor-pointer to-pink-600 text-white px-6 py-3 rounded-full font-medium shadow-md hover:opacity-90 transition-all"
              >
                Enroll Now
              </motion.button>
            )}

            <Link href="/about">
              <motion.button
                whileHover={{ x: 6 }}
                className="bg-gradient-to-r from-purple-950 cursor-pointer to-pink-600 text-white px-6 py-2 rounded-full font-medium shadow-md hover:opacity-90 transition-all"
              >
                <span>More Details</span>
              </motion.button>
            </Link>
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

      <Modal open={open} setOpen={setOpen} mode="enroll" />
    </>
  );
}
