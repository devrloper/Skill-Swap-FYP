"use client";
import { useState } from "react";

export default function TrendingSkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSkills = async () => {
    setLoading(true);
    const res = await fetch("/api/trending");
    const data = await res.json();
    setSkills(data);
    setLoading(false);
  };

  return (
    <div className="p-6 text-center">
      <h2 className="text-3xl font-bold mb-4">🔥 AI Trending Skills</h2>
      <button
        onClick={fetchSkills}
        className="bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 px-6 rounded-xl hover:scale-105 transition-transform"
      >
        {loading ? "Generating..." : "Show Trending Skills"}
      </button>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((item, i) => (
          <div
            key={i}
            className="bg-gray-900 text-white p-4 rounded-2xl shadow-lg hover:scale-105 transition-transform"
          >
            <h3 className="font-semibold text-lg">{item.skill}</h3>
            <p className="text-sm mt-2 text-gray-400">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
