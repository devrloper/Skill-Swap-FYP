"use client";

import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaRegEye,
  FaEye,
  FaEyeSlash,
  FaExchangeAlt,
  FaGraduationCap,
} from "react-icons/fa";
import { auth, db } from "@/app/lib/firebase";
import {
  createUserWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
  signOut,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import ChipLoader from "@/app/components/loader/page";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { showAuthToast } from "@/app/lib/authToast";

export default function SignupPage() {
  const router = useRouter();

  const [role, setRole] = useState("exchanger");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState(""); // inline validation error message
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true); // 1. Add loading state

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!name || !email || !password || !confirmPassword) {
      setMessage("Please fill all fields.");
      setIsError(true);
      return;
    }

    if (!/[A-Za-z]/.test(name.trim())) {
      setMessage(
        "Name must include at least one letter. Numbers only are not allowed.",
      );
      setIsError(true);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match!");
      setIsError(true);
      return;
    }

    try {
      // Keep signup session per-tab by default
      await setPersistence(auth, browserSessionPersistence);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name, // Used for the avatar initial.
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        role,
        emailVerified: true,
        learnerJourneyStarted: false,
        credits: 0,
        createdAt: serverTimestamp(),
      });

      await signOut(auth);

      showAuthToast("Account created successfully");
      setMessage("Account created successfully. Please sign in.");
      setIsError(false);

      setTimeout(() => router.push("/signin"), 2500);
    } catch (err: unknown) {
      console.error("FULL SIGNUP ERROR:", err);

      const code =
        err instanceof Error
          ? (err as Error & { code?: string }).code
          : undefined;
      if (code) {
        setErrorMessage(code.replace("auth/", "").replaceAll("-", " "));
      } else {
        setErrorMessage("Something went wrong. Try again.");
      }

      setIsError(true);
    }
  };

  // 2. Simulate loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1400); 
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
      </AnimatePresence>
      <div
        className="min-h-screen w-full relative flex items-center justify-center bg-[#F0F4F8] font-sans overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/signup.png')" }}
      >
        {/* Background overlay */}
        <div className="absolute inset-0 z-0 " />

        {/* Signup Card */}
        <div className="relative z-10 w-full max-w-7xl px-4 flex justify-center md:justify-end items-center min-h-screen overflow-hidden">
          <div className=" bg-gradient-to-br from-purple-600 to-pink-500/95 w-full max-w-[320px] sm:max-w-[340px] md:max-w-[300px] lg:max-w-[350px] lg:h-[480px] max-h-[520px] md:max-h-[500px] rounded-[30px] shadow-2xl flex flex-col items-center justify-center p-4 sm:p-5 md:p-6 transition-transform hover:scale-[1.01] backdrop-blur-sm lg:-translate-x-40">
            <h2 className="text-[#0A1144] text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center">
              Create Account
            </h2>

            {(message || errorMessage) && (
              <p
                className={`${isError ? "text-red-500" : "text-green-500"} text-xs mb-2`}
              >
                {message || errorMessage}
              </p>
            )}

            <form
              className="w-full space-y-2.5 sm:space-y-3"
              onSubmit={handleSignup}
            >
              {/* Name */}
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /[A-Za-z]/.test(value)) {
                      setName(value);
                    }
                  }}
                  className="w-full py-2 pl-10 pr-3 rounded-full text-xs bg-white shadow-inner outline-none focus:ring-2 focus:ring-purple-800"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-2 pl-10 pr-3 rounded-full text-xs bg-white shadow-inner outline-none focus:ring-2 focus:ring-purple-800"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <FaRegEye className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-2 pl-10 pr-10 rounded-full text-xs bg-white shadow-inner outline-none focus:ring-2 focus:ring-purple-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <FaEyeSlash size={14} />
                  ) : (
                    <FaEye size={14} />
                  )}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <FaRegEye className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full py-2 pl-10 pr-10 rounded-full text-xs bg-white shadow-inner outline-none focus:ring-2 focus:ring-purple-800"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash size={14} />
                  ) : (
                    <FaEye size={14} />
                  )}
                </button>
              </div>

              {/* Role Selection */}
              <div className="pt-1">
                <p className="text-[11px] text-[#0A1144] font-semibold mb-2 text-center">
                  Choose role
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("exchanger")}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-semibold border flex flex-col items-center ${
                      role === "exchanger"
                        ? "bg-[#0A1144] text-white"
                        : "bg-white text-[#0A1144]"
                    }`}
                  >
                    <FaExchangeAlt size={16} className="mb-1" />
                    Exchanger
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("learner")}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-semibold border flex flex-col items-center ${
                      role === "learner"
                        ? "bg-[#0A1144] text-white"
                        : "bg-white text-[#0A1144]"
                    }`}
                  >
                    <FaGraduationCap size={16} className="mb-1" />
                    Learner
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-[#0A1144] text-white py-2.5 rounded-full font-bold text-xs mt-1 hover:bg-black active:scale-95 transition"
              >
                Create Account
              </button>

              <p className="text-center text-[11px] text-black mt-1">
                Already have an account?{" "}
                <Link href="/signin" className="text-purple-950 font-semibold">
                  Login
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
