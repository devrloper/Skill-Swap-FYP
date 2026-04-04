"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/app/components/innernavbar/page";
import SearchBar from "@/app/components/searchbar/page";
import MatchCard from "@/app/components/matchcard/page";
import SidebarFilters from "@/app/components/sidebarfilters/page";
import { auth, db } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import ChipLoader from "@/app/components/loader/page";
interface ProfileData {
  id: string;
  fullName?: string;
  location?: string;
  photoURL?: string | null;
  skills?: {
    learnSkills?: string[];
    teachSkills?: string[];
    customLearnSkills?: string[];
    customTeachSkills?: string[];
  };
  educations?: Array<{ degree?: string; institute?: string }>;
}

export default function FindMatchPage() {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [currentUserProfile, setCurrentUserProfile] =
    useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingConnectTo, setSendingConnectTo] = useState<
    Record<string, boolean>
  >({});
  const [sentConnectTo, setSentConnectTo] = useState<Record<string, boolean>>(
    {},
  );
  const [canSendRequests, setCanSendRequests] = useState<boolean>(false);
useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (!user) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/profiles", { cache: "no-store" });
        const data = await res.json();
        const allProfiles: ProfileData[] = Array.isArray(data?.profiles)
          ? data.profiles
          : [];

        const me = allProfiles.find((p) => p.id === user.uid) || null;
        const others = allProfiles.filter((p) => p.id !== user.uid);
        setCurrentUserProfile(me);
        setProfiles(others);

        const myProfileSnap = await getDoc(doc(db, "profiles", user.uid));
        const myProfileData = myProfileSnap.exists() ? myProfileSnap.data() : null;
        const hasEnrollment = Boolean(
          myProfileData?.enrolled ||
            myProfileData?.profileCompleted ||
            (Array.isArray(myProfileData?.completedSteps) &&
              myProfileData.completedSteps.includes(4)),
        );
        const hasInterview = Boolean(
          myProfileData?.interviewStatus ||
            myProfileData?.interviewScore ||
            myProfileData?.interview,
        );
        const eligible = hasEnrollment && hasInterview;
        setCanSendRequests(eligible);
      } catch (err) {
        console.error("Error loading profiles:", err);
        setCurrentUserProfile(null);
        setProfiles([]);
        setCanSendRequests(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // Animation variants for cards
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const sendConnectRequest = async (toUserId: string) => {
    const fromUserId = auth.currentUser?.uid;
    if (!fromUserId) {
      alert("Please sign in to send a connect request.");
      return;
    }

    if (fromUserId === toUserId) return;
    if (!canSendRequests) {
      alert("Please complete enrollment and the AI interview before sending requests.");
      return;
    }
    if (sendingConnectTo[toUserId] || sentConnectTo[toUserId]) return;

    setSendingConnectTo((prev) => ({ ...prev, [toUserId]: true }));
    try {
      const res = await fetch("/api/connect-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId, toUserId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to send connect request");
      }

      setSentConnectTo((prev) => ({ ...prev, [toUserId]: true }));
      if (data?.alreadyRequested) {
        alert("You already sent a connect request to this user.");
      } else {
        alert("Connect request sent!");
      }
    } catch (err) {
      console.error("Connect request error:", err);
      alert(err instanceof Error ? err.message : "Failed to send request.");
    } finally {
      setSendingConnectTo((prev) => ({ ...prev, [toUserId]: false }));
    }
  };

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
      <div className="relative min-h-screen">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/matching.png')" }}
        />

        {/* Content */}
        <div className="relative z-10">
          <Navbar />
          <section className="relative w-full py-6 md:py-10 px-4 md:px-6 overflow-hidden bg-transparent mt-14">
            {/* --- DECORATIVE BACKGROUND ELEMENTS --- */}
            <div className="absolute -top-10 -right-10 w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-[#f0eeff] rounded-full blur-3xl z-0 opacity-70" />
            <div className="absolute top-10 right-0 w-[150px] md:w-[300px] h-[350px] md:h-[450px] bg-[#f3f1ff] rounded-l-[60px] md:rounded-l-[100px] z-0 hidden sm:block opacity-50 lg:opacity-100" />

            <div className="container mx-auto max-w-6xl relative z-10 text-center">
              {/* --- TOP FLOATING ICONS --- */}
              <div className="absolute left-0 lg:left-4 top-5 hidden md:block">
                <div className="bg-white p-3 rounded-2xl shadow-lg border border-gray-50 transform -rotate-12">
                  <div className="grid grid-cols-2 gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-gray-300"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute right-10 top-10 hidden md:block">
                <div className="bg-white p-3 rounded-full shadow-lg border border-gray-50">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-0.5">
                      <div className="w-3 h-3 bg-red-400 rounded-sm" />
                      <div className="w-3 h-3 bg-green-400 rounded-sm" />
                      <div className="w-3 h-3 bg-yellow-400 rounded-sm" />
                      <div className="w-3 h-3 bg-blue-400 rounded-sm" />
                    </div>
                  </div>
                </div>
              </div>
              {/* --- MAIN CONTENT --- */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="px-2 relative z-30"
              >
                {/* mb-2 use kiya taake niche wali line ke qareeb ho */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-extrabold text-[#1a1a1a] mb-3 tracking-tight leading-tight">
                  Get the <br className="xs:block" /> best tutors! and rock the
                  world
                </h2>

                {/* mb-6 tak spacing kam kar di */}
                <p className="max-w-xl md:max-w-2xl mx-auto text-gray-500 text-sm md:text-base lg:text-lg mb-6 leading-relaxed">
                  Master the skills needed to land your dream job.
                </p>

                <div className="mx-auto max-w-xl mb-6">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl sm:rounded-full bg-white/90 px-3 py-2 shadow-lg ring-1 ring-black/5 backdrop-blur">
                    <input
                      type="text"
                      placeholder="Search your matchings here"
                      className="flex-1 bg-transparent px-2 py-2 text-sm md:text-base text-gray-700 placeholder:text-gray-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      className="w-full sm:w-auto rounded-full bg-purple-600 px-4 py-2 text-sm md:text-base font-semibold text-white hover:bg-black/90 transition"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* --- ILLUSTRATION AREA --- */}
              {/* mt-[-40px] (mobile) aur md:mt-[-80px] (desktop) lagaya taake image text ke pas chali jaye */}
              <div className="relative max-w-[85%] md:max-w-3xl lg:max-w-4xl mx-auto mt-[-30px] md:mt-[-60px] lg:mt-[-120px]">
                {/* Main Illustration Image */}
                <div className="relative z-20 ">
                  <img
                    src="/job5.png"
                    alt="Developer Illustration"
                    className="w-full h-auto object-contain mx-auto max-h-[350px] md:max-h-[580px]"
                  />
                </div>

                {/* Floating Message UI */}
                <div className="absolute top-[20%] -right-[2%] xl:-right-[5%] z-30 hidden lg:block animate-bounce-slow scale-90">
                  <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 flex items-start gap-3 w-56 text-left">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="w-20 h-2 bg-gray-200 rounded mb-2" />
                      <div className="w-full h-2 bg-gray-100 rounded" />
                    </div>
                  </div>
                </div>

                {/* Floating Navigation Arrow */}
                {/* <div className="absolute bottom-20 -right-2 md:right-0 z-30 flex bg-white p-3 md:p-4 rounded-full shadow-xl border border-gray-50 cursor-pointer hover:bg-gray-50">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14m-7-7 7 7-7 7" />
                </svg>
              </div> */}
              </div>
            </div>
          </section>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Heading */}
            <motion.div
              className="text-center mb-10  font-extrabold mt-[-14%] px-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Find a Match
              </motion.h1>
              <motion.p
                className="mt-3 text-sm sm:text-base md:text-lg lg:text-xl text-purple-600 max-w-xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Connect with skilled professionals to exchange services and
                learn from each other.
              </motion.p>
            </motion.div>

            {/* Search */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <SearchBar />
            </motion.div>

            {/* Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Matches */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6 ">
                {loading && (
                  <div className="text-white/80">Loading profiles...</div>
                )}

                {!loading && profiles.length === 0 && (
                  <div className="text-white/80">
                    No other profiles found yet.
                  </div>
                )}

                {!loading &&
                  currentUserProfile &&
                  (() => {
                    const learnSkills = [
                      ...(currentUserProfile.skills?.learnSkills || []),
                      ...(currentUserProfile.skills?.customLearnSkills || []),
                    ];
                    const teachSkills = [
                      ...(currentUserProfile.skills?.teachSkills || []),
                      ...(currentUserProfile.skills?.customTeachSkills || []),
                    ];
                    const tags = Array.from(
                      new Set([...learnSkills, ...teachSkills]),
                    );
                    const offer = teachSkills.length
                      ? teachSkills.join(", ")
                      : "Not set";
                    const seek = learnSkills.length
                      ? learnSkills.join(", ")
                      : "Not set";
                    const education = currentUserProfile.educations?.length
                      ? currentUserProfile.educations
                          .map((e) => e.degree || e.institute)
                          .filter(Boolean)
                          .join(", ")
                      : "";
                    const photoUrl =
                      currentUserProfile.photoURL &&
                      !currentUserProfile.photoURL.startsWith("blob:")
                        ? currentUserProfile.photoURL
                        : undefined;

                    return (
                      <motion.div
                        key={currentUserProfile.id}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.5 }}
                      >
                        <MatchCard
                          id={currentUserProfile.id}
                          name={currentUserProfile.fullName || "Your Profile"}
                          offer={offer}
                          seek={seek}
                          location={
                            currentUserProfile.location || "Location not set"
                          }
                          tags={tags.length ? tags : ["No skills set"]}
                          education={education}
                          imageUrl={photoUrl}
                          showConnect={false}
                        />
                      </motion.div>
                    );
                  })()}

                {!loading &&
                  profiles.map((profile, i) => {
                    const learnSkills = [
                      ...(profile.skills?.learnSkills || []),
                      ...(profile.skills?.customLearnSkills || []),
                    ];
                    const teachSkills = [
                      ...(profile.skills?.teachSkills || []),
                      ...(profile.skills?.customTeachSkills || []),
                    ];

                    const tags = Array.from(
                      new Set([...learnSkills, ...teachSkills]),
                    );
                    const offer = teachSkills.length
                      ? teachSkills.join(", ")
                      : "Not set";
                    const seek = learnSkills.length
                      ? learnSkills.join(", ")
                      : "Not set";
                    const education = profile.educations?.length
                      ? profile.educations
                          .map((e) => e.degree || e.institute)
                          .filter(Boolean)
                          .join(", ")
                      : "";
                    const photoUrl =
                      profile.photoURL && !profile.photoURL.startsWith("blob:")
                        ? profile.photoURL
                        : undefined;

                    return (
                      <motion.div
                        key={profile.id}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.5, delay: 0.1 * i }}
                        // whileHover={{
                        //   scale: 1.03,
                        //   boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                        // }}
                      >
                        <MatchCard
                          id={profile.id}
                          name={profile.fullName || "Profile"}
                          offer={offer}
                          seek={seek}
                          location={profile.location || "Location not set"}
                          tags={tags.length ? tags : ["No skills set"]}
                          education={education}
                          imageUrl={photoUrl}
                          onConnect={() => sendConnectRequest(profile.id)}
                          connectDisabled={
                            !canSendRequests ||
                            !!sendingConnectTo[profile.id] ||
                            !!sentConnectTo[profile.id]
                          }
                          connectLabel={
                            !canSendRequests
                              ? "Enroll first"
                              : sendingConnectTo[profile.id]
                                ? "Sending..."
                                : sentConnectTo[profile.id]
                                  ? "Request sent"
                                  : "Connect"
                          }
                        />
                      </motion.div>
                    );
                  })}
              </div>

              {/* Sidebar */}
              <motion.div
                className="hidden lg:block lg:col-span-1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="sticky top-24">
                  <SidebarFilters />
                </div>
              </motion.div>
            </div>
          </main>
          {/* <Jobboard /> */}
        </div>
      </div>
    </>
  );
}




