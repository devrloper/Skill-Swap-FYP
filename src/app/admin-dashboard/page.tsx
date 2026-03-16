"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import {
  Brain,
  Calendar,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/app/lib/firebase";

type AdminSummary = {
  totals: {
    users: number;
    profiles: number;
    interviewsPass: number;
    interviewsFail: number;
    connectPending: number;
  };
  recent: {
    pendingConnect: Array<{
      id: string;
      fromUserId: string;
      toUserId: string;
      status: string;
      createdAt: unknown;
      fromUserName: string | null;
      toUserName: string | null;
    }>;
    failedInterviews: Array<{
      userId: string;
      name: string;
      interviewScore: number | null;
    }>;
  };
};

function Sparkline({ values }: { values: number[] }) {
  const { width, height, path } = useMemo(() => {
    const w = 120;
    const h = 36;
    if (!values.length) return { width: w, height: h, path: "" };

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values.map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * w;
      const y = h - ((v - min) / range) * h;
      return [x, y] as const;
    });

    const d = points
      .map(
        ([x, y], i) =>
          `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`,
      )
      .join(" ");

    return { width: w, height: h, path: d };
  }, [values]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

function Sidebar({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (name: string) => void;
}) {
  const items = [
    { name: "Dashboard", icon: Home },
    { name: "AI Interviews", icon: Brain },
    { name: "Skill Matching", icon: Users },
    { name: "Messages", icon: MessageCircle },
    { name: "Schedule", icon: Calendar },
    { name: "Settings", icon: Settings },
  ];

  return (
    <aside className="h-full bg-slate-950 text-white border-r border-white/10 p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white flex items-center justify-center font-black shadow-sm">
          S
        </div>
        <div className="leading-tight">
          <p className="font-black">Skill Swap</p>
          <p className="text-xs text-white/60">Admin Panel</p>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const isActive = item.name === active;
          return (
            <button
              type="button"
              key={item.name}
              onClick={() => onSelect(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition border ${
                isActive
                  ? "bg-white/10 border-white/10 text-white"
                  : "border-transparent text-white/80 hover:bg-white/5 hover:border-white/10"
              }`}
            >
              <item.icon
                size={18}
                className={isActive ? "text-fuchsia-300" : "text-white/60"}
              />
              <span className="flex-1 text-left">{item.name}</span>
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-violet-600" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-8 p-4 rounded-3xl bg-white/5 border border-white/10">
        <p className="text-xs font-bold text-white/80 flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-300" /> Admin Tip
        </p>
        <p className="text-xs text-white/60 mt-2 leading-relaxed">
          Check pending connect requests and failed interviews daily to improve
          platform quality.
        </p>
      </div>
    </aside>
  );
}

export default function AdminDashboardPage() {
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/summary?recentLimit=15", {
          cache: "no-store",
        });
        const data = (await res.json().catch(() => ({}))) as Partial<AdminSummary> & {
          error?: string;
        };
        if (!res.ok) throw new Error(data?.error || "Failed to load admin data");
        if (mounted) setSummary(data as AdminSummary);
      } catch (e) {
        if (mounted) {
          setSummary(null);
          setError(e instanceof Error ? e.message : "Failed to load admin data");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const pass = summary?.totals.interviewsPass || 0;
  const fail = summary?.totals.interviewsFail || 0;
  const passRate = pass + fail > 0 ? Math.round((pass / (pass + fail)) * 100) : 0;

  const kpis = [
    {
      label: "Total Users",
      value: summary?.totals.users ?? 0,
      hint: "Total accounts",
      trend: [2, 4, 3, 6, 5, 8, 7],
    },
    {
      label: "Profiles",
      value: summary?.totals.profiles ?? 0,
      hint: "Created profiles",
      trend: [1, 2, 2, 3, 5, 6, 6],
    },
    {
      label: "Pending Requests",
      value: summary?.totals.connectPending ?? 0,
      hint: "Waiting accept/reject",
      trend: [1, 1, 2, 3, 2, 4, 5],
    },
    {
      label: "Interview Pass Rate",
      value: `${passRate}%`,
      hint: `Pass: ${pass} / Fail: ${fail}`,
      trend: [4, 5, 6, 7, 6, 8, 9],
    },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/signin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-indigo-50 p-4 md:p-6">
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-3 top-3 bottom-3 w-[280px] rounded-[32px] overflow-hidden shadow-2xl">
            <div className="h-full relative">
              <Sidebar
                active={active}
                onSelect={(name) => {
                  setActive(name);
                  setSidebarOpen(false);
                }}
              />
              <button
                type="button"
                className="absolute top-4 right-4 w-9 h-9 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur rounded-[28px] shadow-xl overflow-hidden border border-purple-100">
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr]">
          <div className="hidden xl:block">
            <Sidebar active={active} onSelect={setActive} />
          </div>

          <main className="p-6 md:p-8 bg-white/60">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="xl:hidden w-11 h-11 rounded-2xl bg-slate-950 text-white flex items-center justify-center"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu size={18} className="text-white" />
                </button>
                <div>
                  <p className="text-xs font-semibold text-slate-500">{active}</p>
                  <h1 className="text-xl md:text-2xl font-black text-slate-900">
                    Admin Dashboard
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/80 border border-purple-100 rounded-2xl px-4 py-3 w-full md:w-[360px]">
                  <Search size={16} className="text-slate-500" />
                  <input
                    placeholder="Search users, profiles…"
                    className="bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
                  />
                </div>
                <button
                  type="button"
                  className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-3 rounded-2xl bg-white/80 border border-purple-100 text-slate-700"
                >
                  Today <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-3 rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white shadow-sm hover:opacity-95 transition"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-2xl border border-purple-100 bg-white/80 backdrop-blur p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        {kpi.label}
                      </p>
                      <p className="text-2xl font-black text-slate-900 mt-1">
                        {loading ? "…" : kpi.value}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-2">
                        {kpi.hint}
                      </p>
                    </div>
                    <div className="text-violet-500">
                      <Sparkline values={kpi.trend} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-6 mt-6">
              <div className="rounded-2xl border border-purple-100 bg-white/80 backdrop-blur p-7 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">
                      Pending Connect Requests
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Users waiting for accept/reject
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="text-xs font-semibold text-slate-700 hover:underline"
                  >
                    Open user dashboard
                  </Link>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500">
                        <th className="text-left font-semibold py-3">From</th>
                        <th className="text-left font-semibold">To</th>
                        <th className="text-left font-semibold">Status</th>
                        <th className="text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!loading &&
                        summary?.recent.pendingConnect?.map((r) => (
                          <tr key={r.id} className="border-t border-purple-50">
                            <td className="py-4">
                              <p className="font-semibold text-slate-900">
                                {r.fromUserName || "User"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {r.fromUserId}
                              </p>
                            </td>
                            <td>
                              <p className="font-semibold text-slate-900">
                                {r.toUserName || "User"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {r.toUserId}
                              </p>
                            </td>
                            <td>
                              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100">
                                {r.status}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/profile/${r.fromUserId}`}
                                  className="text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-purple-100 hover:bg-purple-50 transition"
                                >
                                  View From
                                </Link>
                                <Link
                                  href={`/profile/${r.toUserId}`}
                                  className="text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-purple-100 hover:bg-purple-50 transition"
                                >
                                  View To
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}

                      {!loading &&
                        summary?.recent.pendingConnect?.length === 0 && (
                          <tr className="border-t border-slate-100">
                            <td colSpan={4} className="py-6 text-sm text-slate-600">
                              No pending connect requests.
                            </td>
                          </tr>
                        )}

                      {loading && (
                        <tr className="border-t border-slate-100">
                          <td colSpan={4} className="py-6 text-sm text-slate-600">
                            Loading…
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-white/80 backdrop-blur p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">Failed Interviews</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Lowest scores (needs review)
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">
                    Pass rate:{" "}
                    <span className="text-slate-900 font-black">{passRate}%</span>
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {!loading &&
                    summary?.recent.failedInterviews?.map((u) => (
                      <div
                        key={u.userId}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {u.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {u.userId}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black px-3 py-1.5 rounded-full bg-white border border-purple-100 text-slate-900">
                            {u.interviewScore ?? "—"}/100
                          </span>
                          <Link
                            href={`/profile/${u.userId}`}
                            className="text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-purple-100 hover:bg-purple-50 transition"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}

                  {!loading &&
                    summary?.recent.failedInterviews?.length === 0 && (
                      <div className="text-sm text-slate-600">
                        No failed interviews found.
                      </div>
                    )}

                  {loading && <div className="text-sm text-slate-600">Loading…</div>}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
