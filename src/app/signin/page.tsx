"use client";

import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);

  // Email/password login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Set persistence

      // Sign in
      await signInWithEmailAndPassword(auth, email, password);

      // Check if admin
      if (email === "aroobaadmin123@gmail.com" && password === "admin123") {
        router.push("/admin-dashboard"); // Admin dashboard
      } else {
        router.push("/dashboard"); // User dashboard
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Google login
  const handleGoogleLogin = async () => {
    setError("");
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f4ff] p-4 font-sans">
      {/* Main Card */}
      <div className="relative w-full max-w-4xl min-h-[550px] flex bg-white rounded-[30px] shadow-2xl overflow-hidden">
        {/* RIGHT DECORATIVE PURPLE SECTION */}
        <div
          className="absolute right-0 top-0 h-full w-[55%] hidden md:flex
             bg-gradient-to-br from-purple-600 to-purple-700"
          style={{
            clipPath:
              "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%, 15% 85%, 5% 70%, 20% 55%, 10% 40%, 25% 25%, 15% 10%)",
          }}
        >
          <div className="flex flex-col items-center justify-center w-full h-full text-white text-center px-4 sm:px-6 md:px-12 lg:px-18 ml-12">
            <img
              src="/login.png"
              alt="Welcome Cartoon"
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-70 lg:h-70 mb-4 sm:mb-5 md:mb-6 object-contain"
            />
            <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4 mt-[-12%]">
              Welcome Back!
            </h2>
            <p className="text-xs sm:text-sm md:text-base leading-relaxed opacity-90 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mt-2">
              Log in to access your dashboard and continue where you left off.
            </p>
          </div>
        </div>

        {/* LEFT FORM SECTION */}
        <div className="w-full md:w-[50%] p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold text-[#333]">Hello!</h1>
              <p className="text-gray-500 font-medium mt-2">
                Sign in to your account
              </p>
            </div>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            <form className="space-y-5" onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <div className="bg-purple-600 p-2 rounded-xl shadow-lg shadow-purple-200">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                </div>
                <input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-16 pr-6 py-4 bg-white border-0 rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] focus:ring-2 focus:ring-purple-300 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Password Field */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <div className="bg-purple-600 p-2 rounded-xl shadow-lg shadow-purple-200">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-16 pr-14 py-4 bg-white border-0 rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] focus:ring-2 focus:ring-purple-300 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between text-[11px] px-2 font-medium">
                <label className="flex items-center text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2 w-3 h-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    checked={remember}
                    onChange={() => setRemember(!remember)}
                  />
                  Remember me
                </label>
                <a
                  href="#"
                  className="text-blue-400 hover:text-blue-600 transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-4 px-4 rounded-full shadow-xl shadow-purple-200 hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest text-sm cursor-pointer"
              >
                Sign In
              </button>

              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full mt-1 flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 rounded-full shadow-lg hover:scale-105 transition"
              >
                <FcGoogle size={24} />
                Sign in with Google
              </button>

              {/* Create Account Link */}
              <p className="text-center text-[11px] text-gray-400 mt-8">
                Don't have an account?{" "}
                <a
                  href="/signup"
                  className="text-blue-500 font-bold hover:underline"
                >
                  Create
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
