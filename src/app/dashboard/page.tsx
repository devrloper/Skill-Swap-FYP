"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  BarChart3,
  ClipboardCheck,
  Settings,
  Search,
  Bell,
  LogOut,
  ChevronDown,
} from "lucide-react";
import ChipLoader from "@/app/components/loader/page";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/app/components/innernavbar/page";
import Modal from "@/app/Modals/profilemodal/page";
import { auth, db } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";

type ConnectRequestItem = {
  id: string;
  fromUserId?: string;
  toUserId?: string;
  status?: string;
};

type WrongAnswerItem = {
  index: number;
  question: string;
  expected: string | null;
  given: string | null;
};

type ProfileDoc = {
  fullName?: string;
  email?: string;
  location?: string;
  phone?: string;
  bio?: string;
  photoURL?: string | null;
  enrolled?: boolean;
  profileCompleted?: boolean;
  completedSteps?: number[];
  interviewStatus?: string;
  interviewScore?: number;
  interview?: {
    result?: string;
    score?: number;
    correct?: number;
    total?: number;
    wrongAnswers?: WrongAnswerItem[];
    completedAt?: string;
  };
  skills?: {
    learnSkills?: string[];
    teachSkills?: string[];
    customLearnSkills?: string[];
    customTeachSkills?: string[];
    learnLevel?: string;
    teachLevel?: string;
  };
};

// Mock data (Function ke bahar reh sakta hai)
const activityData = [
  { day: "Sun", animation: 20, illustration: 40, uiux: 30 },
  { day: "Mon", animation: 18, illustration: 35, uiux: 50 },
  { day: "Tue", animation: 90, illustration: 25, uiux: 45 },
  { day: "Wed", animation: 85, illustration: 70, uiux: 60 },
  { day: "Thu", animation: 25, illustration: 75, uiux: 35 },
  { day: "Fri", animation: 15, illustration: 80, uiux: 40 },
  { day: "Sat", animation: 10, illustration: 78, uiux: 38 },
];

const genderData = [
  { name: "Men", value: 22, color: "#00C2FF" },
  { name: "Woman", value: 10, color: "#FF85B8" },
];

export default function EmployeeDashboard() {
  // 1. States aur Effects hamesha yahan (Function body ke andar) honi chahiye
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<ConnectRequestItem[]>(
    [],
  );
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectRequestItem[]>(
    [],
  );
  const [connectLoading, setConnectLoading] = useState<boolean>(false);
  const [respondingTo, setRespondingTo] = useState<Record<string, boolean>>({});
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [myProfile, setMyProfile] = useState<ProfileDoc | null>(null);
  const [myProfileLoading, setMyProfileLoading] = useState<boolean>(false);
  const [editProfileOpen, setEditProfileOpen] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserId(u?.uid || null);
    });
    return () => unsub();
  }, []);

  const loadProfilesMap = async () => {
    try {
      const res = await fetch("/api/profiles", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      const profiles = Array.isArray(data?.profiles) ? data.profiles : [];
      const map: Record<string, string> = {};
      for (const p of profiles) {
        if (p?.id) map[p.id] = p?.fullName || p?.displayName || "User";
      }
      setProfileNames(map);
    } catch (err) {
      console.error("Failed to load profiles map:", err);
    }
  };

  const loadConnectRequests = async (uid: string) => {
    setConnectLoading(true);
    try {
      const res = await fetch(`/api/connect-requests/list-v2?userId=${uid}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load requests");

      setIncomingRequests(
        Array.isArray(data?.incoming) ? (data.incoming as ConnectRequestItem[]) : [],
      );
      setOutgoingRequests(
        Array.isArray(data?.outgoing) ? (data.outgoing as ConnectRequestItem[]) : [],
      );
    } catch (err) {
      console.error("Failed to load connect requests:", err);
      setIncomingRequests([]);
      setOutgoingRequests([]);
    } finally {
      setConnectLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    loadProfilesMap();
    loadConnectRequests(userId);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setMyProfile(null);
      return;
    }

    let cancelled = false;
    setMyProfileLoading(true);
    (async () => {
      try {
        const snap = await getDoc(doc(db, "profiles", userId));
        const data = snap.exists() ? (snap.data() as ProfileDoc) : null;
        if (!cancelled) setMyProfile(data);
      } catch (err) {
        console.error("Failed to load my profile:", err);
        if (!cancelled) setMyProfile(null);
      } finally {
        if (!cancelled) setMyProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const respond = async (fromUserId: string, action: "accept" | "reject") => {
    if (!userId) return;
    if (respondingTo[fromUserId]) return;

    setRespondingTo((prev) => ({ ...prev, [fromUserId]: true }));
    try {
      const res = await fetch("/api/connect-requests/respond", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId, toUserId: userId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to respond");

      await loadConnectRequests(userId);
    } catch (err) {
      console.error("Respond failed:", err);
      alert(err instanceof Error ? err.message : "Failed to respond.");
    } finally {
      setRespondingTo((prev) => ({ ...prev, [fromUserId]: false }));
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
      <div className="min-h-screen bg-gradient-to-br from-[#fbc2eb] to-purple-600 p-6 font-sans text-slate-700">
        <Navbar />
        <div className="max-w-[1400px] mx-auto bg-white/30 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/40 overflow-hidden flex flex-col md:flex-row min-h-[850px]  mt-14">
          {/* --- SIDEBAR --- */}
          <aside className="w-full md:w-64 bg-white/20 backdrop-blur-lg border-r border-white/20 p-8 flex flex-col">
            <div className="flex flex-col items-center mb-10">
              <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center mb-2 shadow-inner">
                <Users className="text-indigo-600" size={24} />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-900/60">
                Skill Swap
              </h2>
            </div>

            <nav className="space-y-2 flex-1">
              {[
                { name: "Dashboard", icon: LayoutDashboard, active: true },
                { name: "Attendance", icon: CalendarCheck },
                { name: "Employees", icon: Users },
                { name: "Analytics", icon: BarChart3 },
                { name: "Report Attendance", icon: ClipboardCheck },
                { name: "Settings", icon: Settings },
              ].map((item) => (
                <div
                  key={item.name}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all ${
                    item.active
                      ? "bg-gradient-to-r from-blue-100/50 to-purple-100/50 shadow-sm border border-white/50 text-indigo-700"
                      : "text-slate-500 hover:bg-white/20"
                  }`}
                >
                  <item.icon
                    size={20}
                    className={item.active ? "text-indigo-600" : ""}
                  />
                  <span className="text-sm font-semibold">{item.name}</span>
                </div>
              ))}
            </nav>
          </aside>

          {/* --- MAIN CONTENT --- */}
          <main className="flex-1 p-8 overflow-y-auto">
            {/* TOP BAR */}
            <header className="flex items-center justify-between mb-8">
              <div className="relative w-1/2">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  placeholder="search employee"
                  className="w-full bg-white/40 border border-white/60 rounded-full py-2.5 pl-12 pr-4 outline-none focus:ring-2 ring-purple-200 transition-all text-sm placeholder:text-slate-400"
                />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 cursor-pointer">
                  <img
                    src="https://i.pravatar.cc/150?u=admin"
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    alt="Admin"
                  />
                  <span className="text-sm font-bold text-slate-600">
                    Notification
                  </span>
                  <Bell size={18} className="text-blue-500" />
                </div>
                <button className="flex items-center gap-2 text-slate-600 font-bold text-sm hover:text-red-500 transition-colors">
                  Logout <LogOut size={18} />
                </button>
              </div>
            </header>

            <h1 className="text-3xl font-bold text-slate-800 mb-6">
              Welcome {myProfile?.fullName || "User"}!
            </h1>

            {/* MY PROFILE */}
            <div className="mb-8 bg-white/40 border border-white/60 rounded-[30px] p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={myProfile?.photoURL || "https://i.pravatar.cc/150?u=me"}
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                    alt="Profile"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {myProfile?.fullName || "Profile not created yet"}
                    </p>
                    <p className="text-xs text-slate-600 break-all">
                      {myProfile?.email || ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditProfileOpen(true)}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold shadow-md hover:brightness-105 transition"
                  >
                    Edit Profile
                  </button>
                  {userId && (
                    <Link
                      href={`/profile/${userId}`}
                      className="px-4 py-2 rounded-full bg-white/60 border border-white/70 text-slate-700 text-sm font-semibold hover:bg-white/70 transition"
                    >
                      View Public
                    </Link>
                  )}
                </div>
              </div>

              {myProfileLoading && (
                <p className="mt-4 text-sm text-slate-600">Loading profile...</p>
              )}

              {!myProfileLoading && !myProfile && (
                <p className="mt-4 text-sm text-slate-600">
                  You are not enrolled yet. Use the "Enroll Now" button to create
                  your profile and take the AI interview.
                </p>
              )}

              {!myProfileLoading && myProfile && (
                <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-white/50 border border-white/60 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      About
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {myProfile.bio || "—"}
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      {myProfile.location ? `Location: ${myProfile.location}` : ""}
                    </p>
                    <p className="text-xs text-slate-600">
                      {myProfile.phone ? `Phone: ${myProfile.phone}` : ""}
                    </p>
                  </div>

                  <div className="bg-white/50 border border-white/60 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Skills
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[
                        ...(myProfile.skills?.learnSkills || []),
                        ...(myProfile.skills?.teachSkills || []),
                        ...(myProfile.skills?.customLearnSkills || []),
                        ...(myProfile.skills?.customTeachSkills || []),
                      ]
                        .filter(Boolean)
                        .slice(0, 12)
                        .map((s) => (
                          <span
                            key={s}
                            className="text-[11px] bg-purple-100 text-purple-800 px-2 py-1 rounded-lg"
                          >
                            {s}
                          </span>
                        ))}
                      {!(
                        (myProfile.skills?.learnSkills?.length ||
                          myProfile.skills?.teachSkills?.length ||
                          myProfile.skills?.customLearnSkills?.length ||
                          myProfile.skills?.customTeachSkills?.length) ??
                        0
                      ) && <span className="text-sm text-slate-600">—</span>}
                    </div>
                  </div>

                  <div className="bg-white/50 border border-white/60 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      AI Interview
                    </p>
                    <div className="mt-2 text-sm text-slate-700 space-y-1">
                      <p>
                        Status:{" "}
                        <span className="font-semibold">
                          {myProfile.interview?.result ||
                            myProfile.interviewStatus ||
                            "Not attempted"}
                        </span>
                      </p>
                      <p>
                        Marks:{" "}
                        <span className="font-semibold">
                          {typeof myProfile.interview?.score === "number"
                            ? `${myProfile.interview.score}/100`
                            : typeof myProfile.interviewScore === "number"
                              ? `${myProfile.interviewScore}/100`
                              : "—"}
                        </span>
                      </p>
                      {typeof myProfile.interview?.correct === "number" &&
                        typeof myProfile.interview?.total === "number" && (
                          <p className="text-xs text-slate-600">
                            Correct: {myProfile.interview.correct} /{" "}
                            {myProfile.interview.total}
                          </p>
                        )}
                    </div>

                    {(myProfile.interview?.wrongAnswers?.length || 0) > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-slate-600">
                          Wrong answers (showing up to 3)
                        </p>
                        <ul className="mt-2 space-y-2">
                          {myProfile.interview?.wrongAnswers
                            ?.slice(0, 3)
                            .map((w) => (
                              <li
                                key={`${w.index}-${w.question}`}
                                className="text-[12px] text-slate-700 bg-white/60 border border-white/60 rounded-xl p-3"
                              >
                                <p className="font-semibold">{w.question}</p>
                                <p className="mt-1">
                                  <span className="text-slate-500">Your:</span>{" "}
                                  {w.given || "—"}
                                </p>
                                <p>
                                  <span className="text-slate-500">Correct:</span>{" "}
                                  {w.expected || "—"}
                                </p>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CONNECT REQUESTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white/40 border border-white/60 rounded-[30px] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-700">
                    Connection Requests
                  </h3>
                  <button
                    type="button"
                    className="text-xs font-semibold text-purple-700 hover:underline"
                    onClick={() => userId && loadConnectRequests(userId)}
                  >
                    Refresh
                  </button>
                </div>

                {!userId && (
                  <p className="text-sm text-slate-600">
                    Please sign in to view requests.
                  </p>
                )}

                {userId && connectLoading && (
                  <p className="text-sm text-slate-600">Loading…</p>
                )}

                {userId && !connectLoading && (
                  <div className="space-y-3">
                    {incomingRequests
                      .filter((r) => r.status === "pending")
                      .slice(0, 5)
                      .map((r) => (
                        <div
                          key={r.id}
                          className="bg-white/50 border border-white/60 rounded-2xl p-4 flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {profileNames[r.fromUserId || ""] ||
                                r.fromUserId ||
                                "User"}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              sent you a connect request
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {r.fromUserId && (
                              <Link
                                href={`/profile/${r.fromUserId}`}
                                className="text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-white/60"
                              >
                                View
                              </Link>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                r.fromUserId && respond(r.fromUserId, "accept")
                              }
                              disabled={!!respondingTo[r.fromUserId || ""]}
                              className="text-xs font-semibold px-3 py-2 rounded-xl bg-green-600 text-white disabled:opacity-60"
                            >
                              {respondingTo[r.fromUserId || ""]
                                ? "…"
                                : "Accept"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                r.fromUserId && respond(r.fromUserId, "reject")
                              }
                              disabled={!!respondingTo[r.fromUserId || ""]}
                              className="text-xs font-semibold px-3 py-2 rounded-xl bg-red-600 text-white disabled:opacity-60"
                            >
                              {respondingTo[r.fromUserId || ""]
                                ? "…"
                                : "Reject"}
                            </button>
                          </div>
                        </div>
                      ))}

                    {incomingRequests.filter((r) => r.status === "pending")
                      .length === 0 && (
                      <p className="text-sm text-slate-600">
                        No pending requests.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white/40 border border-white/60 rounded-[30px] p-6 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-4">Sent Requests</h3>
                {!userId && (
                  <p className="text-sm text-slate-600">
                    Please sign in to view requests.
                  </p>
                )}
                {userId && connectLoading && (
                  <p className="text-sm text-slate-600">Loading…</p>
                )}
                {userId && !connectLoading && (
                  <div className="space-y-3">
                    {outgoingRequests.slice(0, 5).map((r) => (
                      <div
                        key={r.id}
                        className="bg-white/50 border border-white/60 rounded-2xl p-4 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {profileNames[r.toUserId || ""] ||
                              r.toUserId ||
                              "User"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Status:{" "}
                            <span className="font-semibold">
                              {r.status || "pending"}
                            </span>
                          </p>
                        </div>
                        {r.toUserId && (
                          <Link
                            href={`/profile/${r.toUserId}`}
                            className="text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-white/60"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    ))}

                    {outgoingRequests.length === 0 && (
                      <p className="text-sm text-slate-600">
                        No sent requests.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* TOP GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Total Employees (Donut) */}
              <div className="bg-white/40 border border-white/60 rounded-[30px] p-6 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-700">Total Employees</h3>
                  <span className="text-2xl font-black text-slate-800">32</span>
                </div>
                <div className="h-40 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderData}
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center">
                    <div className="flex gap-4 text-[10px] font-bold">
                      <span className="text-blue-400">● Men</span>
                      <span className="text-pink-400">● Woman</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Skills */}
              <div className="bg-white/40 border border-white/60 rounded-[30px] p-6 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-4">Top Skills</h3>
                <div className="space-y-4">
                  {[
                    {
                      label: "UI/UX Design",
                      val: "90%",
                      color: "bg-orange-400",
                    },
                    {
                      label: "Illustration",
                      val: "85%",
                      color: "bg-purple-400",
                    },
                    { label: "Animation", val: "78%", color: "bg-blue-400" },
                  ].map((skill) => (
                    <div key={skill.label} className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm`}
                      >
                        {skill.val}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          {skill.label}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          100+ projects
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Summary (Attendance/Late/Absent) */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Attendance", val: 30 },
                    { label: "Late", val: 3 },
                    { label: "Absent", val: 2 },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-white/50 rounded-2xl p-3 text-center border border-white/40"
                    >
                      <p className="text-[10px] font-bold text-slate-500 uppercase">
                        {s.label}
                      </p>
                      <p className="text-lg font-black text-slate-800">
                        {s.val}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Birthday Card */}
                <div className="bg-gradient-to-br from-slate-100/80 to-slate-200/80 rounded-[30px] p-4 flex items-center gap-4 relative overflow-hidden border border-white">
                  <img
                    src="https://i.pravatar.cc/150?u=terry"
                    className="w-12 h-12 rounded-full border-2 border-white"
                    alt="Terry"
                  />
                  <div>
                    <h4 className="font-bold text-sm">Terry Calzoni</h4>
                    <p className="text-[10px] text-slate-500">
                      Has birthday today
                    </p>
                    <button className="mt-2 bg-white px-4 py-1 rounded-full text-[10px] font-bold shadow-sm hover:shadow-md transition-all">
                      Wish Him
                    </button>
                  </div>
                  <div className="absolute right-2 top-2 opacity-20">🎈</div>
                </div>
              </div>
            </div>

            {/* BOTTOM GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weekly Activity Line Chart */}
              <div className="lg:col-span-2 bg-white/40 border border-white/60 rounded-[30px] p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-700">Weekly Activity</h3>
                  <button className="text-[10px] bg-white/60 px-3 py-1.5 rounded-lg border border-white/40 font-bold flex items-center gap-2">
                    December, 14 - 18th <ChevronDown size={14} />
                  </button>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#ffffff"
                      />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: "bold" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: "bold" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "15px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="animation"
                        stroke="#00C2FF"
                        strokeWidth={3}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="illustration"
                        stroke="#FF85B8"
                        strokeWidth={3}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="uiux"
                        stroke="#FFB347"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                    <span className="w-3 h-3 rounded-full bg-blue-400"></span>{" "}
                    Animation
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                    <span className="w-3 h-3 rounded-full bg-pink-400"></span>{" "}
                    Illustration
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                    <span className="w-3 h-3 rounded-full bg-orange-400"></span>{" "}
                    UI/UX Design
                  </div>
                </div>
              </div>

              {/* Holiday / Calendar */}
              <div className="space-y-6">
                <div className="bg-white/40 border border-white/60 rounded-[30px] p-6 shadow-sm">
                  <h3 className="font-bold text-sm mb-4">
                    Employees on holiday
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100" />
                        <span className="text-xs font-bold">Unhealthy</span>
                      </div>
                      <span className="text-[10px] font-bold text-red-400">
                        Only today
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100" />
                        <span className="text-xs font-bold">On holiday</span>
                      </div>
                      <span className="text-[10px] font-bold text-red-400">
                        21st to 22nd
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mini Calendar mockup */}
                <div className="bg-white/60 rounded-[30px] p-4 border border-white shadow-sm text-center">
                  <p className="text-[10px] font-bold text-slate-400 mb-2">
                    December
                  </p>
                  <div className="grid grid-cols-7 gap-1 text-[9px] font-bold">
                    {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((d) => (
                      <span key={d} className="text-slate-400">
                        {d}
                      </span>
                    ))}
                    {Array.from({ length: 31 }).map((_, i) => (
                      <span
                        key={i}
                        className={`p-1 ${i + 1 === 21 ? "bg-blue-400 text-white rounded-full" : ""}`}
                      >
                        {i + 1}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <Modal
        open={editProfileOpen}
        setOpen={setEditProfileOpen}
        mode="edit"
        initialStep={1}
      />
    </>
  );
}
