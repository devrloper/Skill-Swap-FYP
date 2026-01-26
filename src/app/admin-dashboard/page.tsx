"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Home,
  Brain,
  Users,
  MessageCircle,
  Calendar,
  Settings,
  Bell,
  Search,
} from "lucide-react";
import Navbar from "@/app/components/innernavbar/page";

const chartData = [
  { month: "Jan", interviews: 12, matches: 8 },
  { month: "Feb", interviews: 18, matches: 14 },
  { month: "Mar", interviews: 15, matches: 10 },
  { month: "Apr", interviews: 22, matches: 18 },
  { month: "May", interviews: 30, matches: 24 },
  { month: "Jun", interviews: 26, matches: 20 },
];

export default function SkillSwapDashboard() {
  return (
    <div className="min-h-screen flex  bg-gradient-to-r from-purple-950 to-pink-950 text-white">
      <Navbar/>
      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-72 flex-col p-6 border-r border-white/10 ">
        <h1 className="text-2xl font-bold mb-10 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          SkillSwap
        </h1>

        <nav className="space-y-3">
          {[
            { name: "Dashboard", icon: Home },
            { name: "AI Interviews", icon: Brain },
            { name: "Skill Matching", icon: Users },
            { name: "Messages", icon: MessageCircle },
            { name: "Schedule", icon: Calendar },
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
      <main className="flex-1 p-6 lg:p-8">
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

            <div className="relative">
              <Bell />
              <span className="absolute -top-2 -right-2 text-xs bg-red-500 w-5 h-5 rounded-full flex items-center justify-center">
                3
              </span>
            </div>

            <img
              src="https://i.pravatar.cc/150?img=32"
              className="w-10 h-10 rounded-full border-2 border-purple-500"
            />
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Total Users",
              value: "1,280",
              color: "from-blue-400 to-blue-600",
            },
            {
              title: "Skill Matches",
              value: "342",
              color: "from-purple-400 to-purple-600",
            },
            {
              title: "AI Interviews",
              value: "198",
              color: "from-pink-400 to-pink-600",
            },
            {
              title: "Sessions Scheduled",
              value: "76",
              color: "from-green-400 to-green-600",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:scale-[1.02] transition"
            >
              <h4 className="text-gray-300">{item.title}</h4>
              <p
                className={`text-3xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h3 className="mb-4 text-lg font-semibold">
              AI Interviews & Skill Matches
            </h3>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Bar
                  dataKey="interviews"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                />
                <Bar dataKey="matches" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* TOP SKILLS */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h3 className="mb-4 text-lg font-semibold">Top Skills</h3>
            {[
              ["React.js", "120 matches"],
              ["UI / UX Design", "98 matches"],
              ["Python", "86 matches"],
              ["Node.js", "72 matches"],
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

        {/* BOTTOM */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MATCHES */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h3 className="mb-4 text-lg font-semibold">Recent Skill Matches</h3>
            <table className="w-full text-sm">
              <thead className="text-gray-400">
                <tr>
                  <th className="text-left py-2">Learner</th>
                  <th>Teacher</th>
                  <th>Skill</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Arooba", "Ali Khan", "React.js"],
                  ["Sara", "John", "UI Design"],
                  ["Hassan", "Emma", "Python"],
                ].map((row, i) => (
                  <tr key={i} className="border-t border-white/10">
                    <td className="py-3">{row[0]}</td>
                    <td>{row[1]}</td>
                    <td className="text-purple-400">{row[2]}</td>
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
                  <p className="text-sm text-gray-400">
                    New skill request message
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
