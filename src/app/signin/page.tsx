"use client";

import React, { useState, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  signOut,
} from "firebase/auth";
import { auth, db } from "@/app/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import ChipLoader from "@/app/components/loader/page";
import { motion, AnimatePresence } from "framer-motion";
import { showAuthToast } from "@/app/lib/authToast";
const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const safeNextPath =
    nextPath &&
    nextPath.startsWith("/") &&
    !nextPath.startsWith("//") &&
    !nextPath.startsWith("/signin") &&
    !nextPath.startsWith("/signup") &&
    !nextPath.startsWith("/api")
      ? nextPath
      : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 1. Add loading state

  const establishSessionCookie = async (firebaseUser: {
    getIdToken: () => Promise<string>;
  }) => {
    const idToken = await firebaseUser.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken, remember }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || "Failed to create session");
    }
  };

  // Email/password login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Per-tab vs shared login across tabs:
      // - remember = true  => shared (localStorage)
      // - remember = false => per-tab (sessionStorage)
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence,
      );

      // Sign in
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await user.reload();
      if (!user.emailVerified) {
        await sendEmailVerification(user, {
          url: `${window.location.origin}/signin`,
          handleCodeInApp: false,
        });
        await signOut(auth);
        setError(
          "Please verify your email first. We sent a new verification link to your inbox.",
        );
        return;
      }

      // Create httpOnly session cookie for route protection (middleware).
      await establishSessionCookie(user);

      // Admin check
      if (email === "aroobaadmin123@gmail.com" && password === "admin123") {
        showAuthToast("Signed in successfully");
        router.push(
          safeNextPath?.startsWith("/admin-dashboard")
            ? safeNextPath
            : "/admin-dashboard",
        );
        return;
      }

      // Get user role from Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        throw new Error("User data not found");
      }
      await updateDoc(userRef, { emailVerified: true });

      const userData = userSnap.data() as { role?: string };
      const { role } = userData;

      // Role-based redirect
      if (role === "learner") {
        showAuthToast("Signed in successfully");
        router.push(safeNextPath || "/learner");
      } else {
        showAuthToast("Signed in successfully");
        router.push(safeNextPath || "/dashboard"); 
      }
    } catch (err: unknown) {
      console.error("LOGIN ERROR:", err);
      setError("Invalid email or password");
    }
  };

  // Google login
  const handleGoogleLogin = async () => {
    setError("");
    const provider = new GoogleAuthProvider();

    try {
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence,
      );

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create httpOnly session cookie for route protection (middleware).
      await establishSessionCookie(user);

      // Check Firestore if user exists
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // First-time Google login → default role as 'exchanger' or show role selection modal
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || "",
          email: user.email,
          role: "exchanger", // default role
          emailVerified: user.emailVerified,
          credits: 0,
          createdAt: serverTimestamp(),
        });
      } else {
        await setDoc(
          userRef,
          { emailVerified: user.emailVerified },
          { merge: true },
        );
      }

      const userData = (await getDoc(userRef)).data() as { role?: string } | undefined;
      const role = userData?.role;

      // Role-based redirect
      if (user.email === "aroobaadmin123@gmail.com") {
        showAuthToast("Signed in successfully");
        router.push(
          safeNextPath?.startsWith("/admin-dashboard")
            ? safeNextPath
            : "/admin-dashboard",
        );
      } else if (role === "learner") {
        showAuthToast("Signed in successfully");
        router.push(safeNextPath || "/learner");
      } else {
        showAuthToast("Signed in successfully");
        router.push(safeNextPath || "/dashboard");
      }
    } catch (err: unknown) {
      console.error("GOOGLE LOGIN ERROR:", err);
      setError(err instanceof Error ? err.message : "Login failed");
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
      </AnimatePresence>{" "}
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f4ff] p-4 font-sans">
        {/* Main Card */}
        <div className="relative w-full max-w-4xl min-h-[550px] flex flex-col md:flex-row bg-white rounded-[30px] shadow-2xl overflow-hidden">
          <div className="md:hidden bg-gradient-to-br from-purple-600 to-purple-700 px-6 py-8 text-white text-center">
            <img
              src="/login.png"
              alt="Welcome Cartoon"
              className="mx-auto w-28 h-28 object-contain"
            />
            <h2 className="font-bold text-2xl mt-3">Welcome Back!</h2>
            <p className="text-xs opacity-90 mt-2">
              Log in to access your dashboard and continue where you left off.
            </p>
          </div>

          {/* RIGHT DECORATIVE PURPLE SECTION */}
          <div
            className="relative md:absolute md:right-0 md:top-0 h-[280px] md:h-full w-full md:w-[55%] hidden md:flex
             bg-gradient-to-br from-purple-600 to-purple-700"
            style={{
              clipPath:
                "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%, 19% 85%, 0% 70%, 20% 55%, 10% 40%, 25% 25%, 15% 10%)",
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
          <div className="w-full md:w-[50%] p-5 sm:p-6 md:p-10 lg:p-12 flex flex-col justify-center bg-white relative z-10">
            <div className="w-full max-w-sm mx-auto">
              {/* Heading */}
              <div className="text-center mb-8 md:mb-10">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#333]">
                  Hello!
                </h1>
                <p className="text-gray-500 font-medium mt-2 text-xs sm:text-sm">
                  Sign in to your account
                </p>
              </div>

              {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

              <form className="space-y-4 sm:space-y-5" onSubmit={handleLogin}>
                {/* EMAIL */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-5 flex items-center pointer-events-none">
                    <div className="bg-purple-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-white"
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
                    className="w-full pl-12 sm:pl-14 md:pl-16 pr-4 sm:pr-6 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base bg-white border-0 rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] focus:ring-2 focus:ring-purple-300 outline-none placeholder:text-gray-400"
                  />
                </div>

                {/* PASSWORD */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-5 flex items-center pointer-events-none">
                    <div className="bg-purple-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-white"
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
                    className="w-full pl-12 sm:pl-14 md:pl-16 pr-10 sm:pr-14 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base bg-white border-0 rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] focus:ring-2 focus:ring-purple-300 outline-none placeholder:text-gray-400"
                  />
                </div>

                {/* REMEMBER + FORGOT */}
                <div className="flex items-center justify-between text-[10px] sm:text-xs px-1 sm:px-2 font-medium">
                  <label className="flex items-center text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2 w-3 h-3 rounded border-gray-300 text-purple-600"
                      checked={remember}
                      onChange={() => setRemember(!remember)}
                    />
                    Remember me
                  </label>

                  <a
                    href="/forgot-password"
                    className="text-blue-400 hover:text-blue-600 transition"
                  >
                    Forgot password?
                  </a>
                </div>

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-2.5 sm:py-3 md:py-4 px-4 rounded-full shadow-xl hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest text-xs sm:text-sm cursor-pointer"
                >
                  Sign In
                </button>

                {/* GOOGLE BUTTON */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-white text-black font-semibold py-2.5 sm:py-3 rounded-full shadow-lg hover:scale-[1.02] transition text-xs sm:text-sm cursor-pointer"
                >
                  <FcGoogle size={20} className="sm:w-6 sm:h-6" />
                  Sign in with Google
                </button>

                {/* SIGNUP */}
                <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-6 sm:mt-8">
                  Don&apos;t have an account?{" "}
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
    </>
  );
};

export default LoginPage;
