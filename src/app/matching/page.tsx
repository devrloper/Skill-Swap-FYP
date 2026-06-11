"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, GraduationCap, Sparkles, Star } from "lucide-react";
import Navbar from "@/app/components/innernavbar/page";
import SearchBar from "@/app/components/searchbar/page";
import MatchCard from "@/app/components/matchcard/page";
import SkillRequestPanel from "@/app/components/skill-request-panel/page";
import SidebarFilters from "@/app/components/sidebarfilters/page";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import ChipLoader from "@/app/components/loader/page";
interface ProfileData {
  id: string;
  fullName?: string;
  location?: string;
  gender?: string;
  photoURL?: string | null;
  photoUpdatedAt?: number;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  reviews?: Array<{
    id: string;
    reviewerId?: string;
    reviewerName?: string;
    rating?: number;
    comment?: string;
    topic?: string | null;
    createdAt?: unknown;
  }>;
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
  const [filteredProfiles, setFilteredProfiles] = useState<ProfileData[]>([]);
  const [currentUserProfile, setCurrentUserProfile] =
    useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);
  const [filters, setFilters] = useState({
    offering: "",
    seeking: "",
    location: "",
    skillLevel: "",
  });

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
      } catch (err) {
        console.error("Error loading profiles:", err);
        setCurrentUserProfile(null);
        setProfiles([]);
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

  const getProfileImageUrl = (profile?: ProfileData | null) => {
    const raw = profile?.photoURL;
    if (!raw || raw.startsWith("blob:")) return undefined;
    if (raw.startsWith("data:")) return raw;
    const stamp = profile?.photoUpdatedAt ? `?v=${profile.photoUpdatedAt}` : "";
    return `${raw}${stamp}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  const handleFilterChange = (newFilters: {
    offering: string;
    seeking: string;
    location: string;
    skillLevel: string;
  }) => {
    setFilters(newFilters);

    let filtered = [...profiles];

    // Filter by offering (teaching skills)
    if (newFilters.offering) {
      filtered = filtered.filter((profile) => {
        const teachSkills = [
          ...(profile.skills?.teachSkills || []),
          ...(profile.skills?.customTeachSkills || []),
        ];
        return teachSkills.some((skill) =>
          skill.toLowerCase().includes(newFilters.offering.toLowerCase()),
        );
      });
    }

    // Filter by seeking (learning skills)
    if (newFilters.seeking) {
      filtered = filtered.filter((profile) => {
        const learnSkills = [
          ...(profile.skills?.learnSkills || []),
          ...(profile.skills?.customLearnSkills || []),
        ];
        return learnSkills.some((skill) =>
          skill.toLowerCase().includes(newFilters.seeking.toLowerCase()),
        );
      });
    }

    // Filter by location
    if (newFilters.location) {
      filtered = filtered.filter((profile) =>
        profile.location?.toLowerCase().includes(newFilters.location.toLowerCase()),
      );
    }

    setFilteredProfiles(filtered);
  };

  const openProfileModal = (profile: ProfileData) => {
    setSelectedProfile(profile);
  };

  const closeProfileModal = () => setSelectedProfile(null);
  const selectedReviews = selectedProfile?.reviews || [];
  const selectedRating =
    typeof selectedProfile?.rating === "number" && Number.isFinite(selectedProfile.rating)
      ? selectedProfile.rating
      : 0;

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
              <SearchBar onFilter={handleFilterChange} />
            </motion.div>

            {/* Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Matches */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6 ">
                {loading && (
                  <div className="text-white/80">Loading profiles...</div>
                )}

                {!loading && (filters.offering || filters.seeking || filters.location) && filteredProfiles.length === 0 && (
                  <div className="text-white/80">
                    No profiles found matching your criteria.
                  </div>
                )}

                {!loading && !filters.offering && !filters.seeking && !filters.location && profiles.length === 0 && (
                  <div className="text-white/80">
                    No other profiles found yet.
                  </div>
                )}

                {/* Display current user profile */}
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
                    return (
                      <motion.div
                        key={currentUserProfile.id}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.5 }}
                      >
                        <MatchCard
                          name={currentUserProfile.fullName || "Your Profile"}
                          offer={offer}
                          seek={seek}
                          gender={currentUserProfile.gender || ""}
                          location={
                            currentUserProfile.location || "Location not set"
                          }
                          tags={tags.length ? tags : ["No skills set"]}
                          imageUrl={getProfileImageUrl(currentUserProfile)}
                          rating={currentUserProfile.rating || 0}
                          reviewCount={
                            currentUserProfile.reviewCount ||
                            currentUserProfile.reviews?.length ||
                            0
                          }
                          showConnect={false}
                          onConnect={() => {}}
                        />
                      </motion.div>
                    );
                  })()}

                {/* Display filtered or all profiles */}
                {!loading &&
                  (filters.offering || filters.seeking || filters.location
                    ? filteredProfiles
                    : profiles
                  ).map((profile, i) => {
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
                    return (
                      <motion.div
                        key={profile.id}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.5, delay: 0.1 * i }}
                      >
                        <MatchCard
                          name={profile.fullName || "Profile"}
                          offer={offer}
                          seek={seek}
                          gender={profile.gender || ""}
                          location={profile.location || "Location not set"}
                          tags={tags.length ? tags : ["No skills set"]}
                          imageUrl={getProfileImageUrl(profile)}
                          rating={profile.rating || 0}
                          reviewCount={
                            profile.reviewCount || profile.reviews?.length || 0
                          }
                          onConnect={() => openProfileModal(profile)}
                          connectDisabled={false}
                          connectLabel="View Profile"
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
      <AnimatePresence>
        {selectedProfile && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-4 backdrop-blur-md sm:items-center sm:py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeProfileModal}
          >
            <motion.div
              initial={{ scale: 0.96, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 20, opacity: 0 }}
              transition={{ duration: 0.22 }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full max-w-5xl max-h-[calc(100vh-2rem)] overflow-hidden rounded-[28px] border border-white/50 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.25)] sm:max-h-[90vh] flex flex-col"
            >
              <div className="relative border-b border-slate-100 bg-gradient-to-r from-purple-700 to-pink-600 px-6 py-5 text-white">
                <button
                  type="button"
                  onClick={closeProfileModal}
                  className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
                  aria-label="Close profile preview"
                >
                  <X size={18} />
                </button>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="h-20 w-20 overflow-hidden rounded-3xl border border-white/25 bg-white/15 shadow-lg">
                    <img
                      src={getProfileImageUrl(selectedProfile) || "/girl.png"}
                      alt={selectedProfile.fullName || "Profile"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/75">
                      Profile Preview
                    </p>
                    <h2 className="mt-1 text-2xl font-black leading-tight">
                      {selectedProfile.fullName || "Profile"}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/90">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                        <MapPin size={14} />
                        {selectedProfile.location || "Location not set"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                        <Star size={14} fill="currentColor" />
                        {selectedRating ? selectedRating.toFixed(1) : "No rating"}{" "}
                        ({selectedProfile.reviewCount || selectedReviews.length} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 overflow-y-auto p-6 lg:grid-cols-[0.95fr_1.05fr] flex-1 min-h-0">
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-800">
                      <Sparkles size={18} className="text-purple-600" />
                      <h3 className="font-bold">About</h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {selectedProfile.bio || "No bio has been added yet."}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2 text-slate-800">
                        <Sparkles size={17} className="text-emerald-600" />
                        <h4 className="font-bold">Skills Offered</h4>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          ...(selectedProfile.skills?.teachSkills || []),
                          ...(selectedProfile.skills?.customTeachSkills || []),
                        ].length ? (
                          [
                            ...(selectedProfile.skills?.teachSkills || []),
                            ...(selectedProfile.skills?.customTeachSkills || []),
                          ].map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">Not set</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2 text-slate-800">
                        <GraduationCap size={17} className="text-purple-600" />
                        <h4 className="font-bold">Skills Wanted</h4>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          ...(selectedProfile.skills?.learnSkills || []),
                          ...(selectedProfile.skills?.customLearnSkills || []),
                        ].length ? (
                          [
                            ...(selectedProfile.skills?.learnSkills || []),
                            ...(selectedProfile.skills?.customLearnSkills || []),
                          ].map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">Not set</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-slate-800">
                        <Star size={18} className="text-amber-500" fill="currentColor" />
                        <h3 className="font-bold">Feedback</h3>
                      </div>
                      <span className="text-sm font-semibold text-slate-500">
                        {selectedRating ? `${selectedRating.toFixed(1)} / 5` : "No rating yet"}
                      </span>
                    </div>

                    <div className="mt-4">
                      {selectedReviews.length ? (
                        <div className="space-y-3">
                          {selectedReviews.slice(0, 5).map((review) => {
                            const rating =
                              typeof review.rating === "number" && Number.isFinite(review.rating)
                                ? review.rating
                                : Number(review.rating) || 0;
                            return (
                              <div
                                key={review.id}
                                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-bold text-slate-800">
                                    {review.reviewerName || "Skill Swap Member"}
                                  </p>
                                  <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-500">
                                    <Star size={14} fill="currentColor" />
                                    {rating || "-"}
                                  </span>
                                </div>
                                {review.topic && (
                                  <p className="mt-1 text-xs font-semibold text-purple-600">
                                    {review.topic}
                                  </p>
                                )}
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {review.comment || "No written comment."}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          No feedback has been added for this profile yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <SkillRequestPanel
                    receiverId={selectedProfile.id}
                    receiverName={selectedProfile.fullName || "Profile"}
                    receiverTeachSkills={[
                      ...(selectedProfile.skills?.teachSkills || []),
                      ...(selectedProfile.skills?.customTeachSkills || []),
                    ]}
                    receiverLearnSkills={[
                      ...(selectedProfile.skills?.learnSkills || []),
                      ...(selectedProfile.skills?.customLearnSkills || []),
                    ]}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
