"use client";

import { useEffect, useState } from "react";
import Navbar from "@/app/components/innernavbar/page";
import SearchBar from "@/app/components/searchbar/page";
import MatchCard from "@/app/components/matchcard/page";
import SidebarFilters from "@/app/components/sidebarfilters/page";
import { auth, db } from "@/app/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface ProfileData {
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
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setProfile(null);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        setProfile(snap.exists() ? (snap.data() as ProfileData) : null);
      } catch (err) {
        console.error("Error loading profile:", err);
        setProfile(null);
      }
    });

    return () => unsub();
  }, []);

  const learnSkills = [
    ...(profile?.skills?.learnSkills || []),
    ...(profile?.skills?.customLearnSkills || []),
  ];
  const teachSkills = [
    ...(profile?.skills?.teachSkills || []),
    ...(profile?.skills?.customTeachSkills || []),
  ];

  const tags = Array.from(new Set([...learnSkills, ...teachSkills]));
  const offer = teachSkills.length ? teachSkills.join(", ") : "Not set";
  const seek = learnSkills.length ? learnSkills.join(", ") : "Not set";
  const education = profile?.educations?.length
    ? profile.educations
        .map((e) => e.degree || e.institute)
        .filter(Boolean)
        .join(", ")
    : "";
  const photoUrl =
    profile?.photoURL && !profile.photoURL.startsWith("blob:")
      ? profile.photoURL
      : undefined;

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/study1.png')" }}
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Heading */}
          <div className="text-center mb-10 text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Find a Match
            </h1>
            <p className="mt-3 text-5xl sm:text-xl font-extrabold text-white/80 max-w-xl mx-auto">
              Connect with skilled professionals to exchange services and learn
              from each other.
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <SearchBar />
          </div>

          {/* Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Matches */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {profile && (
                <MatchCard
                  name={profile.fullName || "Your Profile"}
                  offer={offer}
                  seek={seek}
                  location={profile.location || "Location not set"}
                  tags={tags.length ? tags : ["No skills set"]}
                  education={education}
                  imageUrl={photoUrl}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24">
                <SidebarFilters />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
