"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const DashboardPage = () => {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch profile data from backend / API
    const storedProfile = JSON.parse(localStorage.getItem("profile") || "null");
    setProfile(storedProfile);
  }, []);

  if (!profile) return <p className="text-center mt-10">No profile found. Please create one.</p>;

  return (
    <div className="min-h-screen bg-white p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-purple-600 mb-6">Your Dashboard</h1>

      <div className="bg-purple-50 p-6 rounded-xl space-y-4 shadow">
        <p><span className="font-semibold">Name:</span> {profile.name}</p>
        <p><span className="font-semibold">Email:</span> {profile.email}</p>
        <p><span className="font-semibold">Bio:</span> {profile.bio}</p>
        <p><span className="font-semibold">Education:</span> {profile.education}</p>
        <p><span className="font-semibold">Skills:</span> {profile.skills}</p>
        <p><span className="font-semibold">Experience:</span> {profile.experience}</p>

        <button
          className="bg-pink-500 text-white py-2 px-4 rounded hover:bg-pink-600 transition"
          onClick={() => router.push("/profile")}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
