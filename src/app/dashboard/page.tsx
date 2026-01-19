"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { LucideHome, LucideUser, LucideMessageCircle, LucideZap, LucideCalendar } from "lucide-react";
import Navbar from "@/app/components/navbar/page"
const sidebarItems = [
  { name: "Home", icon: LucideHome },
  { name: "Profile", icon: LucideUser },
  { name: "AI Interview", icon: LucideZap },
  { name: "Skill Matching", icon: LucideZap },
  { name: "Messages", icon: LucideMessageCircle },
  { name: "Schedule", icon: LucideCalendar },
];

const sampleChartData = [
  { date: "Jan 1", interviews: 5, matches: 3 },
  { date: "Jan 2", interviews: 7, matches: 4 },
  { date: "Jan 3", interviews: 6, matches: 5 },
  { date: "Jan 4", interviews: 8, matches: 6 },
];

export default function ProfessionalDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Navbar/>
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-r from-purple-950 to-pink-800 text-white flex flex-col mt-15">
        <nav className="flex-1 p-6 space-y-2">
          {sidebarItems.map((item) => (
            <a
              key={item.name}
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        {/* Top Navbar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Hi, Arooba</span>
            <img
              src="/user-avatar.png"
              alt="User"
              className="w-12 h-12 rounded-full border-2 border-purple-600 object-cover"
            />
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            { title: "Total Users", value: 120 },
            { title: "Active Matches", value: 45 },
            { title: "Upcoming Classes", value: 12 },
            { title: "Pending Requests", value: 5 },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition-shadow"
            >
              <h3 className="text-gray-500">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Interviews Trend</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sampleChartData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="interviews" stroke="#2563EB" strokeWidth={2} />
                <Line type="monotone" dataKey="matches" stroke="#7C3AED" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Skill Match Summary</h2>
            <ul className="space-y-2 text-gray-600">
              <li>John Doe - ReactJS / NodeJS</li>
              <li>Jane Smith - Graphic Design / Figma</li>
              <li>Ali Khan - Python / Django</li>
            </ul>
          </div>
        </div>

        {/* Upcoming Classes Table */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Classes</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Learner</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Teacher</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Skill</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-purple-50 transition-colors">
                <td className="px-4 py-2 text-gray-800">John Doe</td>
                <td className="px-4 py-2 text-gray-800">Jane Smith</td>
                <td className="px-4 py-2 text-gray-800">ReactJS</td>
                <td className="px-4 py-2 text-gray-800">10 Jan 2026, 5 PM</td>
              </tr>
              <tr className="hover:bg-purple-50 transition-colors">
                <td className="px-4 py-2 text-gray-800">Ali Khan</td>
                <td className="px-4 py-2 text-gray-800">Sara Ahmed</td>
                <td className="px-4 py-2 text-gray-800">Python</td>
                <td className="px-4 py-2 text-gray-800">11 Jan 2026, 2 PM</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
