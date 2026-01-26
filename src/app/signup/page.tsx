"use client";

import React, { useState } from "react";
import { FaUser, FaRegEye, FaExchangeAlt, FaGraduationCap } from "react-icons/fa";
import { auth, db } from "@/app/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc,serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();

  const [role, setRole] = useState("exchanger");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(""); // success or error message
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
  
    if (!name || !email || !password || !confirmPassword) {
      setMessage("Please fill all fields.");
      setIsError(true);
      return;
    }
  
    if (password !== confirmPassword) {
      setMessage("Passwords do not match!");
      setIsError(true);
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
  
      const user = userCredential.user;
  
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        role,
        createdAt: serverTimestamp(),
      });
  
      setMessage("Account created successfully! Redirecting to signin...");
      setIsError(false);
  
      setTimeout(() => router.push("/signin"), 1500);
    }  catch (err: any) {
      console.error("FULL SIGNUP ERROR:", err);
    
      if (err.code) {
        setErrorMessage(err.code.replace("auth/", "").replaceAll("-", " "));
      } else {
        setErrorMessage("Something went wrong. Try again.");
      }
    
      setIsError(true);
    }
    
  };
  
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#F0F4F8] font-sans overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/signup.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Signup Card */}
      <div className="relative z-10 w-full max-w-7xl px-4 flex justify-center md:justify-end items-center">
        <div className="bg-gradient-to-br from-purple-600 to-pink-500 w-full max-w-[350px] sm:max-w-[380px] aspect-[3.5/5] rounded-[35px] shadow-2xl flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 transform transition-transform hover:scale-[1.01] lg:-translate-x-30 opacity-85">
          <h2 className="text-[#0A1144] text-xl sm:text-2xl font-bold mb-4 sm:mb-6 tracking-tight text-center">
            Create Account
          </h2>

          {message && (
            <p className={`${isError ? "text-red-500" : "text-green-500"} text-sm mb-2`}>
              {message}
            </p>
          )}

          <form className="w-full space-y-3 sm:space-y-4" onSubmit={handleSignup}>
            {/* Name */}
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full py-2.5 sm:py-3 pl-10 pr-3 rounded-full border-none focus:ring-2 focus:ring-purple-800 outline-none shadow-inner text-xs sm:text-sm bg-white"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-2.5 sm:py-3 pl-10 pr-3 rounded-full border-none focus:ring-2 focus:ring-purple-800 outline-none shadow-inner text-xs sm:text-sm bg-white"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <FaRegEye className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-2.5 sm:py-3 pl-10 pr-3 rounded-full border-none focus:ring-2 focus:ring-purple-800 outline-none shadow-inner text-xs sm:text-sm bg-white"
              />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <FaRegEye className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full py-2.5 sm:py-3 pl-10 pr-3 rounded-full border-none focus:ring-2 focus:ring-purple-800 outline-none shadow-inner text-xs sm:text-sm bg-white"
              />
            </div>

            {/* Role Selection */}
            <div className="pt-2">
              <p className="text-xs text-[#0A1144] font-semibold mb-2 text-center">
                Choose your role
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole("exchanger")}
                  className={`flex-1 flex flex-col items-center py-2 rounded-2xl text-xs sm:text-sm font-semibold border transition-all ${
                    role === "exchanger"
                      ? "bg-[#0A1144] text-white border-[#0A1144]"
                      : "bg-white text-[#0A1144] border-gray-300"
                  }`}
                >
                  <FaExchangeAlt size={20} className="mb-1" />
                  Skill Exchanger
                </button>

                <button
                  type="button"
                  onClick={() => setRole("learner")}
                  className={`flex-1 flex flex-col items-center py-2 rounded-2xl text-xs sm:text-sm font-semibold border transition-all ${
                    role === "learner"
                      ? "bg-[#0A1144] text-white border-[#0A1144]"
                      : "bg-white text-[#0A1144] border-gray-300"
                  }`}
                >
                  <FaGraduationCap size={20} className="mb-1" />
                  Learner
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-[#0A1144] text-white py-3 rounded-full font-bold text-sm shadow-lg hover:bg-black transition-all active:scale-95 mt-1"
            >
              Create Account
            </button>

            <div className="mt-2 text-center text-sm text-black">
              <p>
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="text-purple-950 font-semibold hover:underline"
                >
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
