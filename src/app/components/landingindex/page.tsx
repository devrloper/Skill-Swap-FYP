"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Modal from "@/app/Modals/profilemodal/page";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { CheckCircle2, Sparkles, X } from "lucide-react";

export default function HeroSection() {
  const [open, setOpen] = useState(false);
  const [signupPromptOpen, setSignupPromptOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleMoreDetails = () => {
    if (!user) {
      setSignupPromptOpen(true);
      return;
    }

    setOpen(true);
  };

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
            {/* {!isEnrolled && (
              <motion.button
                onClick={() => setOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-950 cursor-pointer to-pink-600 text-white px-6 py-3 rounded-full font-medium shadow-md hover:opacity-90 transition-all"
              >
                Enroll Now
              </motion.button>
            )} */}

            <div>
              <motion.button
                type="button"
                onClick={handleMoreDetails}
                whileHover={{ x: 6 }}
                className="bg-gradient-to-r from-purple-950 cursor-pointer to-pink-600 text-white px-6 py-3 rounded-full font-medium shadow-md hover:opacity-90 transition-all"
              >
                <span>More Details</span>
              </motion.button>
            </div>
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

      {signupPromptOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-8">
          <div className="flex min-h-full items-start justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative my-auto w-full max-w-[22rem] overflow-hidden rounded-2xl bg-white text-center shadow-2xl sm:max-w-md sm:rounded-3xl"
          >
            <button
              type="button"
              onClick={() => setSignupPromptOpen(false)}
              aria-label="Close signup prompt"
              className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-2 text-gray-500 shadow-sm transition hover:bg-white hover:text-gray-900 sm:right-4 sm:top-4 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="bg-gradient-to-br from-purple-950 via-purple-700 to-pink-500 px-5 pb-8 pt-9 text-white sm:px-7 sm:pb-10 sm:pt-12">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 shadow-inner ring-1 ring-white/25 sm:mb-4 sm:h-16 sm:w-16">
                <Sparkles size={26} />
              </div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">
                Sign up first
              </h2>
              <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-purple-50 sm:mt-3 sm:text-sm sm:leading-6">
                Join Skill Swap to unlock profile details, connect with matches,
                and start exchanging skills.
              </p>
            </div>

            <div className="-mt-4 px-4 pb-5 sm:-mt-5 sm:px-7 sm:pb-7">
              <div className="rounded-xl bg-white p-3 text-left shadow-lg ring-1 ring-purple-100 sm:rounded-2xl sm:p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
                  What you get
                </p>
                <div className="mt-3 grid gap-2 text-xs text-gray-700 sm:text-sm">
                  {[
                    "Complete your learning profile",
                    "Find skill partners faster",
                    "Access AI interview and session tools",
                  ].map((item) => (
                    <p key={item} className="flex items-center gap-2">
                      <CheckCircle2
                        size={15}
                        className="shrink-0 text-pink-500"
                      />
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:justify-center sm:gap-3">
                <Link
                  href="/signup"
                  className="rounded-full bg-gradient-to-r from-purple-950 to-pink-600 px-7 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 sm:py-3 cursor-pointer"
                >
                  Sign Up
                </Link>
                <button
                  type="button"
                  onClick={() => setSignupPromptOpen(false)}
                  className="rounded-full border border-purple-200 px-7 py-2.5 text-sm font-semibold text-purple-900 transition hover:bg-purple-50 sm:py-3 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
          </div>
        </div>
      )}

      <Modal open={open} setOpen={setOpen} mode="enroll" />
    </>
  );
}
