"use client";

import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Home, Brain, Users, MessageCircle, Calendar, Settings, Bell, Search } from "lucide-react";
import Navbar from "@/app/components/innernavbar/page";

const userChartData = [
  { week: "Week 1", sessions: 2, matches: 1 },
  { week: "Week 2", sessions: 3, matches: 2 },
  { week: "Week 3", sessions: 1, matches: 1 },
  { week: "Week 4", sessions: 4, matches: 3 },
];

export default function UserDashboard() {
  return (
    <div className="min-h-screen flex bg-gradient-to-r from-purple-950 to-pink-950 text-white">
      <Navbar />

      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-72 flex-col p-6 border-r border-white/10">
        <h1 className="text-2xl font-bold mb-10 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          SkillSwap
        </h1>

        <nav className="space-y-3">
          {[
            { name: "Dashboard", icon: Home },
            { name: "My Skills", icon: Users },
            { name: "My AI Interviews", icon: Brain },
            { name: "Messages", icon: MessageCircle },
            { name: "My Schedule", icon: Calendar },
            { name: "Settings", icon: Settings },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 cursor-pointer transition"
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 lg:p-8 mt-18">
        {/* TOP BAR */}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">Welcome back, Arooba 👋</h2>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center bg-white/10 rounded-full px-4 py-2">
              <Search size={16} />
              <input
                placeholder="Search skills or users..."
                className="bg-transparent outline-none px-2 text-sm"
              />
            </div>

           
          </div>
        </div>

        {/* PERSONAL STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: "My Matches", value: "12", color: "from-purple-400 to-purple-600" },
            { title: "Sessions Completed", value: "8", color: "from-green-400 to-green-600" },
            { title: "AI Interviews Taken", value: "5", color: "from-pink-400 to-pink-600" },
            { title: "Pending Requests", value: "2", color: "from-yellow-400 to-yellow-600" },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:scale-[1.02] transition"
            >
              <h4 className="text-gray-300">{item.title}</h4>
              <p className={`text-3xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h3 className="mb-4 text-lg font-semibold">My Sessions & Matches</h3>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={userChartData}>
                <XAxis dataKey="week" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Bar dataKey="sessions" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="matches" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* MY TOP SKILLS */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h3 className="mb-4 text-lg font-semibold">My Top Skills</h3>
            {[
              ["React.js", "5 matches"],
              ["UI / UX Design", "3 matches"],
              ["Python", "2 matches"],
            ].map((skill) => (
              <div
                key={skill[0]}
                className="flex justify-between py-3 border-b border-white/10 last:border-none"
              >
                <span>{skill[0]}</span>
                <span className="text-purple-400">{skill[1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT ACTIVITIES & MESSAGES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MY RECENT MATCHES */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h3 className="mb-4 text-lg font-semibold">My Recent Matches</h3>
            <table className="w-full text-sm">
              <thead className="text-gray-400">
                <tr>
                  <th className="text-left py-2">Teacher / Learner</th>
                  <th>Skill</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Ali Khan", "React.js", "Completed"],
                  ["John Doe", "UI Design", "Pending"],
                  ["Emma Smith", "Python", "Completed"],
                ].map((row, i) => (
                  <tr key={i} className="border-t border-white/10">
                    <td className="py-3">{row[0]}</td>
                    <td className="text-purple-400">{row[1]}</td>
                    <td>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MESSAGES */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h3 className="mb-4 text-lg font-semibold">Recent Chats</h3>
            {["Ali", "Emma", "David"].map((name) => (
              <div
                key={name}
                className="flex gap-3 py-3 border-b border-white/10 last:border-none"
              >
                <img
                  src={`https://i.pravatar.cc/100?u=${name}`}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-gray-400">New skill request message</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
