"use client";

import Button from "@/app/ui/button";
import { useState } from "react";

interface SearchBarProps {
  onFilter?: (filters: {
    offering: string;
    seeking: string;
    location: string;
    skillLevel: string;
  }) => void;
}

export default function SearchBar({ onFilter }: Readonly<SearchBarProps>) {
  const [offering, setOffering] = useState("");
  const [seeking, setSeeking] = useState("");
  const [location, setLocation] = useState("");
  const [skillLevel, setSkillLevel] = useState("");

  const handleSearch = () => {
    if (onFilter) {
      onFilter({
        offering,
        seeking,
        location,
        skillLevel,
      });
    }
  };

  return (
    <div className="bg-white/30 backdrop-blur-lg border border-white/30 p-4 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3">
      <select
        value={offering}
        onChange={(e) => setOffering(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm bg-white"
      >
        <option value="">I'm offering...</option>
        <option value="JavaScript">JavaScript</option>
        <option value="Python">Python</option>
        <option value="React">React</option>
        <option value="Node.js">Node.js</option>
        <option value="TypeScript">TypeScript</option>
        <option value="Web Design">Web Design</option>
        <option value="UI/UX">UI/UX</option>
        <option value="Mobile Development">Mobile Development</option>
      </select>

      <select
        value={seeking}
        onChange={(e) => setSeeking(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm bg-white"
      >
        <option value="">I'm seeking...</option>
        <option value="JavaScript">JavaScript</option>
        <option value="Python">Python</option>
        <option value="React">React</option>
        <option value="Node.js">Node.js</option>
        <option value="TypeScript">TypeScript</option>
        <option value="Web Design">Web Design</option>
        <option value="UI/UX">UI/UX</option>
        <option value="Mobile Development">Mobile Development</option>
      </select>

      <select
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm bg-white"
      >
        <option value="">Location</option>
        <option value="Karachi">Karachi</option>
        <option value="Lahore">Lahore</option>
        <option value="Islamabad">Islamabad</option>
        <option value="Online">Online</option>
        <option value="Hyderabad">Hyderabad</option>
      </select>

      <select
        value={skillLevel}
        onChange={(e) => setSkillLevel(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm bg-white"
      >
        <option value="">Skill Level</option>
        <option value="Beginner">Beginner</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Advanced">Advanced</option>
        <option value="Expert">Expert</option>
      </select>

      <Button onClick={handleSearch}>Search</Button>
    </div>
  );
}
  