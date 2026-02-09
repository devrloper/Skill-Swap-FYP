"use client";

import { useEffect, useState } from "react";
import Navbar from "@/app/components/innernavbar/page";
import SearchBar from "@/app/components/searchbar/page";
import MatchCard from "@/app/components/matchcard/page";
import SidebarFilters from "@/app/components/sidebarfilters/page";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

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
  const [currentUserProfile, setCurrentUserProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
              {loading && (
                <div className="text-white/80">Loading profiles...</div>
              )}

              {!loading && profiles.length === 0 && (
                <div className="text-white/80">
                  No other profiles found yet.
                </div>
              )}

              {!loading && currentUserProfile && (
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
                    new Set([...learnSkills, ...teachSkills])
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
                    <MatchCard
                      key={currentUserProfile.id}
                      name={currentUserProfile.fullName || "Your Profile"}
                      offer={offer}
                      seek={seek}
                      location={currentUserProfile.location || "Location not set"}
                      tags={tags.length ? tags : ["No skills set"]}
                      education={education}
                      imageUrl={photoUrl}
                    />
                  );
                })()
              )}

              {!loading &&
                profiles.map((profile) => {
                  const learnSkills = [
                    ...(profile.skills?.learnSkills || []),
                    ...(profile.skills?.customLearnSkills || []),
                  ];
                  const teachSkills = [
                    ...(profile.skills?.teachSkills || []),
                    ...(profile.skills?.customTeachSkills || []),
                  ];

                  const tags = Array.from(
                    new Set([...learnSkills, ...teachSkills])
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
                    <MatchCard
                      key={profile.id}
                      name={profile.fullName || "Profile"}
                      offer={offer}
                      seek={seek}
                      location={profile.location || "Location not set"}
                      tags={tags.length ? tags : ["No skills set"]}
                      education={education}
                      imageUrl={photoUrl}
                    />
                  );
                })}
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
