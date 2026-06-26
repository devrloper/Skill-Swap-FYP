"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Home,
  LineChart,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/app/lib/firebase";

type RoleName = "learner" | "exchanger";

type CountItem = {
  name: string;
  value: number;
};

type TrendItem = {
  date: string;
  value: number;
};

type SkillItem = {
  name: string;
  count: number;
};

type RecentUser = {
  id: string;
  name: string;
  email: string;
  roles: RoleName[];
  credits: number;
  hasProfile: boolean;
  learnerJourney: boolean;
  createdAt: number;
};

type RecentRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  offeredSkill: string;
  requestedSkill: string;
  requestType: string;
  status: string;
  createdAt: number;
};

type FailedInterview = {
  userId: string;
  name: string;
  interviewScore: number;
};

type AdminSummary = {
  totals: {
    users: number;
    learners: number;
    exchangers: number;
    dualRoleUsers: number;
    profiles: number;
    learnerJourneys: number;
    requests: number;
    pendingRequests: number;
    acceptedRequests: number;
    rejectedRequests: number;
    sessions: number;
    upcomingSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    interviewsPass: number;
    interviewsFail: number;
    totalCredits: number;
    awardedCredits: number;
    purchases: number;
    revenue: number;
  };
  health: {
    profileCompletionRate: number;
    learnerActivationRate: number;
    requestAcceptanceRate: number;
    sessionCompletionRate: number;
  };
  breakdowns: {
    usersByRole: CountItem[];
    requestsByStatus: CountItem[];
    sessionsByStatus: CountItem[];
  };
  trends: {
    users: TrendItem[];
    requests: TrendItem[];
    sessions: TrendItem[];
  };
  skills: {
    topTeaching: SkillItem[];
    topLearning: SkillItem[];
    topRequested: SkillItem[];
  };
  recent: {
    users: RecentUser[];
    requests: RecentRequest[];
    failedInterviews: FailedInterview[];
  };
};

const navItems = [
  { name: "Overview", icon: Home },
  { name: "Users", icon: Users },
  { name: "Learners", icon: BookOpen },
  { name: "Exchangers", icon: UserCheck },
  { name: "Requests", icon: Target },
  { name: "Sessions", icon: CalendarClock },
  { name: "Interviews", icon: Brain },
  { name: "Finance", icon: CircleDollarSign },
  { name: "Settings", icon: Settings },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value || 0));
}

function formatMoney(value: number) {
  if (!value) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: number) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function maxCount(items: Array<{ value?: number; count?: number }>) {
  return Math.max(1, ...items.map((item) => item.value ?? item.count ?? 0));
}

function MiniBars({
  items,
  color = "bg-fuchsia-500",
}: {
  items: TrendItem[];
  color?: string;
}) {
  const max = maxCount(items);
  return (
    <div className="flex h-16 items-end gap-1.5">
      {items.map((item) => (
        <div
          key={item.date}
          className="flex min-w-0 flex-1 flex-col items-center gap-1"
          title={`${item.date}: ${item.value}`}
        >
          <div
            className={`w-full rounded-t-md ${color}`}
            style={{ height: `${Math.max(10, (item.value / max) * 60)}px` }}
          />
        </div>
      ))}
    </div>
  );
}

function ProgressBar({
  value,
  color = "bg-gradient-to-r from-violet-400 to-pink-400",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-violet-100">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

function RoleBadge({ role }: { role: RoleName }) {
  const styles =
    role === "learner"
      ? "border-violet-100 bg-violet-50 text-violet-600"
      : "border-pink-100 bg-pink-50 text-pink-600";
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black capitalize ${styles}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const clean = status.toLowerCase();
  const styles =
    clean === "accepted" || clean === "completed"
      ? "border-violet-100 bg-violet-50 text-violet-600"
      : clean === "rejected" || clean === "cancelled"
        ? "border-pink-100 bg-pink-50 text-pink-600"
        : "border-purple-100 bg-purple-50 text-purple-600";
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black capitalize ${styles}`}>
      {status || "pending"}
    </span>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-white/70 bg-white/60 p-5 shadow-[0_20px_60px_rgba(156,120,255,0.13)] backdrop-blur-xl">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-pink-300 text-white shadow-sm">
          <Icon size={18} />
        </div>
        <div>
          <h2 className="text-base font-black text-[#2b2450]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-[#8b83a8]">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="rounded-[26px] border border-white/70 bg-white/60 p-5 shadow-[0_20px_60px_rgba(156,120,255,0.13)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#9a91b8]">{title}</p>
          <p className="mt-2 text-3xl font-black text-[#2b2450]">{value}</p>
          <p className="mt-2 text-sm text-[#8b83a8]">{detail}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function SkillBars({ items, empty }: { items: SkillItem[]; empty: string }) {
  const max = maxCount(items);
  if (!items.length) return <p className="text-sm text-[#8b83a8]">{empty}</p>;
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.name}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-bold capitalize text-[#4d4772]">{item.name}</span>
            <span className="font-black text-[#2b2450]">{item.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-violet-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-300 to-pink-300"
              style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Sidebar({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (name: string) => void;
}) {
  return (
    <aside className="flex h-full flex-col border-r border-white/60 bg-white/55 p-5 text-[#6f6692] backdrop-blur-2xl">
      <div className="mb-7 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-300 to-pink-300 text-lg font-black text-white shadow-[0_12px_35px_rgba(180,130,255,.34)]">
          S
        </div>
        <div>
          <p className="font-black text-[#8c5df6]">Skill Swap</p>
          <p className="text-xs text-[#a89fc4]">Admin Panel</p>
        </div>
      </div>

      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onSelect(item.name)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                isActive
                  ? "border-violet-100 bg-violet-50/90 text-violet-600 shadow-sm"
                  : "border-transparent text-[#9088ac] hover:border-violet-100 hover:bg-white/70 hover:text-violet-600"
              }`}
            >
              <Icon size={17} />
              <span className="flex-1 text-left">{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[24px] border border-white/70 bg-gradient-to-br from-violet-50/90 to-pink-50/80 p-4 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-black text-[#7c5ce0]">
          <ShieldCheck size={15} className="text-violet-500" />
          Admin health
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[#958cb0]">
          Monitor learner journeys, exchanger readiness, requests, credits, and session flow from one place.
        </p>
      </div>
    </aside>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [active, setActive] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadAdminSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/summary", {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as Partial<AdminSummary> & {
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Failed to load admin data");
      setSummary(data as AdminSummary);
    } catch (err) {
      setSummary(null);
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdminSummary();
  }, [loadAdminSummary]);

  const totals = summary?.totals;
  const health = summary?.health;
  const query = searchQuery.trim().toLowerCase();
  const matches = useCallback(
    (...values: unknown[]) =>
      !query || values.some((value) => String(value || "").toLowerCase().includes(query)),
    [query],
  );

  const filteredUsers = useMemo(
    () =>
      (summary?.recent.users || []).filter((user) =>
        matches(user.name, user.email, user.id, user.roles.join(" ")),
      ),
    [summary, matches],
  );

  const filteredRequests = useMemo(
    () =>
      (summary?.recent.requests || []).filter((request) =>
        matches(
          request.senderName,
          request.receiverName,
          request.offeredSkill,
          request.requestedSkill,
          request.status,
          request.requestType,
        ),
      ),
    [summary, matches],
  );

  const learnerUsers = filteredUsers.filter((user) => user.roles.includes("learner"));
  const exchangerUsers = filteredUsers.filter((user) => user.roles.includes("exchanger"));
  const failedInterviews = (summary?.recent.failedInterviews || []).filter((item) =>
    matches(item.name, item.userId, item.interviewScore),
  );
  const interviewTotal = (totals?.interviewsPass || 0) + (totals?.interviewsFail || 0);
  const passRate = interviewTotal ? Math.round(((totals?.interviewsPass || 0) / interviewTotal) * 100) : 0;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("Logout cookie clear failed:", err);
    }
    await signOut(auth);
    router.push("/signin");
  };

  const renderUserRows = (users: RecentUser[]) => (
    <div className="max-w-full overflow-x-auto pb-3 [scrollbar-color:#c58cff_#f3e8ff] [scrollbar-width:thin]">
      <table className="w-full min-w-[1040px] text-sm">
        <thead>
          <tr className="border-b border-violet-100/80 text-left text-xs font-black uppercase tracking-wide text-[#9a91b8]">
            <th className="w-[300px] whitespace-nowrap py-3 pr-6">User</th>
            <th className="w-[220px] whitespace-nowrap pr-6">Role</th>
            <th className="w-[150px] whitespace-nowrap pr-6">Profile</th>
            <th className="w-[190px] whitespace-nowrap pr-6">Learner Journey</th>
            <th className="w-[110px] whitespace-nowrap pr-6">Credits</th>
            <th className="w-[130px] whitespace-nowrap pr-6">Joined</th>
            <th className="w-[110px] whitespace-nowrap">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-violet-50/90">
              <td className="py-4 pr-6">
                <p className="font-black text-[#2b2450]">{user.name}</p>
                <p className="mt-1 max-w-[280px] truncate text-xs text-[#958cb0]">{user.email || user.id}</p>
              </td>
              <td className="pr-6">
                <div className="flex flex-wrap gap-1.5">
                  {user.roles.map((role) => (
                    <RoleBadge key={role} role={role} />
                  ))}
                </div>
              </td>
              <td className="whitespace-nowrap pr-6">
                {user.hasProfile ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-violet-600">
                    <CheckCircle2 size={14} /> Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-pink-500">
                    <Clock3 size={14} /> Missing
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap pr-6">
                {user.learnerJourney ? (
                  <span className="text-xs font-black text-violet-600">Started</span>
                ) : (
                  <span className="text-xs font-black text-[#958cb0]">Not started</span>
                )}
              </td>
              <td className="whitespace-nowrap pr-6 font-black text-[#2b2450]">{formatNumber(user.credits)}</td>
              <td className="whitespace-nowrap pr-6 text-[#6f6692]">{formatDate(user.createdAt)}</td>
              <td className="whitespace-nowrap">
                <Link
                  href={`/profile/${user.id}`}
                  className="rounded-xl border border-violet-100 bg-white/60 px-3 py-2 text-xs font-black text-violet-600 transition hover:bg-violet-50"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
          {!users.length && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-sm text-[#8b83a8]">
                No users match this view.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderRequestRows = (requests: RecentRequest[]) => (
    <div className="max-w-full overflow-x-auto pb-3 [scrollbar-color:#c58cff_#f3e8ff] [scrollbar-width:thin]">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="border-b border-violet-100/80 text-left text-xs font-black uppercase tracking-wide text-[#9a91b8]">
            <th className="py-3">From</th>
            <th>To</th>
            <th>Skill Flow</th>
            <th>Type</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id} className="border-b border-violet-50/90">
              <td className="py-4">
                <p className="font-black text-[#2b2450]">{request.senderName}</p>
                <p className="mt-1 max-w-[180px] truncate text-xs text-[#958cb0]">{request.senderId}</p>
              </td>
              <td>
                <p className="font-black text-[#2b2450]">{request.receiverName}</p>
                <p className="mt-1 max-w-[180px] truncate text-xs text-[#958cb0]">{request.receiverId}</p>
              </td>
              <td>
                <p className="font-bold text-[#4d4772]">{request.offeredSkill || "Learning commitment"}</p>
                <p className="mt-1 text-xs text-[#958cb0]">wants {request.requestedSkill || "a skill"}</p>
              </td>
              <td className="capitalize text-[#6f6692]">{request.requestType.replace("_", " ")}</td>
              <td>
                <StatusBadge status={request.status} />
              </td>
              <td className="text-[#6f6692]">{formatDate(request.createdAt)}</td>
              <td>
                <div className="flex gap-2">
                  <Link
                    href={`/profile/${request.senderId}`}
                    className="rounded-xl border border-violet-100 bg-white/60 px-3 py-2 text-xs font-black text-violet-600 hover:bg-violet-50"
                  >
                    Sender
                  </Link>
                  <Link
                    href={`/profile/${request.receiverId}`}
                    className="rounded-xl border border-violet-100 bg-white/60 px-3 py-2 text-xs font-black text-violet-600 hover:bg-violet-50"
                  >
                    Receiver
                  </Link>
                </div>
              </td>
            </tr>
          ))}
          {!requests.length && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-sm text-[#8b83a8]">
                No requests match this view.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#c8bbff_0%,#dcecff_36%,#fae0f5_72%,#ffd4ef_100%)] p-0 text-[#2b2450] md:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,.55),transparent_28%),radial-gradient(circle_at_84%_22%,rgba(255,182,226,.45),transparent_30%)]" />
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-violet-950/25 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-3 left-3 w-[286px] overflow-hidden rounded-[28px] shadow-2xl">
            <Sidebar
              active={active}
              onSelect={(name) => {
                setActive(name);
                setSidebarOpen(false);
              }}
            />
            <button
              type="button"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="relative mx-auto grid min-h-[calc(100vh-48px)] max-w-[1440px] overflow-hidden rounded-[34px] border border-white/65 bg-white/30 shadow-[0_30px_90px_rgba(132,104,220,.24)] backdrop-blur-xl lg:grid-cols-[280px_1fr]">
        <div className="hidden lg:block">
          <Sidebar active={active} onSelect={setActive} />
        </div>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-white/50 bg-white/35 px-4 py-4 backdrop-blur-2xl md:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/65 text-violet-600 shadow-sm lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu size={18} />
                </button>
                <div>
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-fuchsia-700">
                    <Sparkles size={14} />
                    Admin analytics
                  </p>
                  <h1 className="text-2xl font-black text-[#2b2450] md:text-3xl">
                    {active}
                  </h1>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex h-11 min-w-0 items-center gap-2 rounded-2xl border border-white/70 bg-white/65 px-3 shadow-sm sm:w-[340px]">
                  <Search size={16} className="shrink-0 text-violet-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search users, skills, requests"
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#4d4772] outline-none placeholder:text-[#aaa2c3]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void loadAdminSummary()}
                  className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/65 px-4 text-sm font-black text-violet-600 shadow-sm transition hover:bg-white"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-400 px-4 text-sm font-black text-white shadow-[0_12px_35px_rgba(180,130,255,.32)] transition hover:opacity-95"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-4 md:p-6">
            {error && (
              <div className="rounded-2xl border border-pink-100 bg-pink-50/80 p-4 text-sm font-bold text-pink-600">
                {error}
              </div>
            )}

            {loading && !summary ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-36 animate-pulse rounded-[26px] bg-white/55" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    title="Total users"
                    value={formatNumber(totals?.users || 0)}
                    detail={`${formatNumber(totals?.learners || 0)} learners, ${formatNumber(totals?.exchangers || 0)} exchangers`}
                    icon={Users}
                    accent="bg-gradient-to-br from-violet-100 to-pink-100 text-violet-600"
                  />
                  <MetricCard
                    title="Learner journeys"
                    value={formatNumber(totals?.learnerJourneys || 0)}
                    detail={`${health?.learnerActivationRate || 0}% learner activation`}
                    icon={BookOpen}
                    accent="bg-gradient-to-br from-blue-100 to-violet-100 text-violet-600"
                  />
                  <MetricCard
                    title="Open requests"
                    value={formatNumber(totals?.pendingRequests || 0)}
                    detail={`${health?.requestAcceptanceRate || 0}% acceptance rate`}
                    icon={Target}
                    accent="bg-gradient-to-br from-pink-100 to-fuchsia-100 text-pink-600"
                  />
                  <MetricCard
                    title="Session flow"
                    value={formatNumber(totals?.sessions || 0)}
                    detail={`${formatNumber(totals?.upcomingSessions || 0)} upcoming meetings`}
                    icon={CalendarClock}
                    accent="bg-gradient-to-br from-violet-100 to-blue-100 text-violet-600"
                  />
                </div>

                {active === "Overview" && (
                  <>
                    <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
                      <Section
                        title="Platform pulse"
                        subtitle="Last 7 days across signups, requests, and sessions"
                        icon={LineChart}
                      >
                        <div className="grid gap-5 md:grid-cols-3">
                          <div>
                            <p className="mb-3 text-xs font-black uppercase text-[#9a91b8]">Users</p>
                            <MiniBars items={summary?.trends.users || []} color="bg-gradient-to-t from-violet-400 to-pink-300" />
                          </div>
                          <div>
                            <p className="mb-3 text-xs font-black uppercase text-[#9a91b8]">Requests</p>
                            <MiniBars items={summary?.trends.requests || []} color="bg-gradient-to-t from-blue-300 to-violet-300" />
                          </div>
                          <div>
                            <p className="mb-3 text-xs font-black uppercase text-[#9a91b8]">Sessions</p>
                            <MiniBars items={summary?.trends.sessions || []} color="bg-gradient-to-t from-pink-300 to-fuchsia-300" />
                          </div>
                        </div>
                      </Section>

                      <Section title="Health scorecard" subtitle="Critical operating ratios" icon={Activity}>
                        <div className="space-y-5">
                          {[
                            ["Profile completion", health?.profileCompletionRate || 0, "bg-gradient-to-r from-violet-400 to-pink-300"],
                            ["Learner activation", health?.learnerActivationRate || 0, "bg-gradient-to-r from-blue-300 to-violet-400"],
                            ["Request acceptance", health?.requestAcceptanceRate || 0, "bg-gradient-to-r from-pink-300 to-fuchsia-300"],
                            ["Session completion", health?.sessionCompletionRate || 0, "bg-gradient-to-r from-violet-300 to-blue-300"],
                          ].map(([label, value, color]) => (
                            <div key={String(label)}>
                              <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="font-bold text-[#6f6692]">{label}</span>
                                <span className="font-black text-[#2b2450]">{value}%</span>
                              </div>
                              <ProgressBar value={Number(value)} color={String(color)} />
                            </div>
                          ))}
                        </div>
                      </Section>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                      <Section title="Teaching demand" subtitle="Most common exchanger skills" icon={TrendingUp}>
                        <SkillBars items={summary?.skills.topTeaching || []} empty="No teaching skills yet." />
                      </Section>
                      <Section title="Learning demand" subtitle="Learner interests and journeys" icon={BookOpen}>
                        <SkillBars items={summary?.skills.topLearning || []} empty="No learner skills yet." />
                      </Section>
                      <Section title="Requested skills" subtitle="Skills requested in booking flow" icon={Target}>
                        <SkillBars items={summary?.skills.topRequested || []} empty="No requested skills yet." />
                      </Section>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <Section title="Recent users" subtitle="Newest learners and exchangers" icon={Users}>
                        {renderUserRows(filteredUsers.slice(0, 6))}
                      </Section>
                      <Section title="Recent requests" subtitle="Latest skill-swap and mentor activity" icon={Target}>
                        {renderRequestRows(filteredRequests.slice(0, 6))}
                      </Section>
                    </div>
                  </>
                )}

                {active === "Users" && (
                  <Section title="User directory" subtitle="Learners, exchangers, credits, profile state" icon={Users}>
                    {renderUserRows(filteredUsers)}
                  </Section>
                )}

                {active === "Learners" && (
                  <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
                    <Section title="Learner analytics" subtitle="Activation and skill interests" icon={BookOpen}>
                      <div className="space-y-5">
                        <MetricCard
                          title="Learners"
                          value={formatNumber(totals?.learners || 0)}
                          detail={`${formatNumber(totals?.learnerJourneys || 0)} journeys started`}
                          icon={BookOpen}
                          accent="bg-gradient-to-br from-blue-100 to-violet-100 text-violet-600"
                        />
                        <SkillBars items={summary?.skills.topLearning || []} empty="No learner skill data yet." />
                      </div>
                    </Section>
                    <div className="min-w-0">
                    <Section title="Learner users" subtitle="Learners and journey status" icon={Users}>
                      {renderUserRows(learnerUsers)}
                    </Section>
                    </div>
                  </div>
                )}

                {active === "Exchangers" && (
                  <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
                    <Section title="Exchanger analytics" subtitle="Provider readiness and teaching skills" icon={UserCheck}>
                      <div className="space-y-5">
                        <MetricCard
                          title="Exchangers"
                          value={formatNumber(totals?.exchangers || 0)}
                          detail={`${formatNumber(totals?.profiles || 0)} completed profiles`}
                          icon={UserCheck}
                          accent="bg-gradient-to-br from-violet-100 to-pink-100 text-violet-600"
                        />
                        <SkillBars items={summary?.skills.topTeaching || []} empty="No teaching skill data yet." />
                      </div>
                    </Section>
                    <div className="min-w-0">
                    <Section title="Exchanger users" subtitle="Users available for skill exchange" icon={Users}>
                      {renderUserRows(exchangerUsers)}
                    </Section>
                    </div>
                  </div>
                )}

                {active === "Requests" && (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      {(summary?.breakdowns.requestsByStatus || []).map((item) => (
                        <MetricCard
                          key={item.name}
                          title={item.name}
                          value={formatNumber(item.value)}
                          detail="Skill and mentor request status"
                          icon={item.name === "Pending" ? Clock3 : item.name === "Accepted" ? CheckCircle2 : XCircle}
                          accent={
                            item.name === "Pending"
                              ? "bg-purple-50 text-purple-600"
                              : item.name === "Accepted"
                                ? "bg-violet-50 text-violet-600"
                                : "bg-pink-50 text-pink-600"
                          }
                        />
                      ))}
                    </div>
                    <Section title="Request control" subtitle="Track skill swaps and mentor bookings" icon={Target}>
                      {renderRequestRows(filteredRequests)}
                    </Section>
                  </div>
                )}

                {active === "Sessions" && (
                  <div className="grid gap-4 xl:grid-cols-[.75fr_1.25fr]">
                    <Section title="Session status" subtitle="Meeting pipeline by state" icon={CalendarClock}>
                      <div className="space-y-5">
                        {(summary?.breakdowns.sessionsByStatus || []).map((item) => (
                          <div key={item.name}>
                            <div className="mb-2 flex items-center justify-between">
                              <span className="font-bold text-[#6f6692]">{item.name}</span>
                              <span className="font-black text-[#2b2450]">{formatNumber(item.value)}</span>
                            </div>
                            <ProgressBar
                              value={totals?.sessions ? (item.value / totals.sessions) * 100 : 0}
                              color={
                                item.name === "Upcoming"
                                  ? "bg-gradient-to-r from-blue-300 to-violet-400"
                                  : item.name === "Completed"
                                    ? "bg-gradient-to-r from-violet-400 to-pink-300"
                                    : "bg-gradient-to-r from-pink-300 to-fuchsia-300"
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </Section>
                    <Section title="Session trend" subtitle="Session activity over the last week" icon={BarChart3}>
                      <MiniBars items={summary?.trends.sessions || []} color="bg-gradient-to-t from-violet-400 to-pink-300" />
                      <p className="mt-5 text-sm text-[#8b83a8]">
                        Completion rate is {health?.sessionCompletionRate || 0}% across all stored sessions.
                      </p>
                    </Section>
                  </div>
                )}

                {active === "Interviews" && (
                  <div className="grid gap-4 xl:grid-cols-[.75fr_1.25fr]">
                    <Section title="AI interview quality" subtitle="Pass/fail outcome and review queue" icon={Brain}>
                      <div className="space-y-5">
                        <MetricCard
                          title="Pass rate"
                          value={`${passRate}%`}
                          detail={`${formatNumber(totals?.interviewsPass || 0)} passed, ${formatNumber(totals?.interviewsFail || 0)} failed`}
                          icon={Brain}
                          accent="bg-gradient-to-br from-violet-100 to-pink-100 text-violet-600"
                        />
                        <ProgressBar value={passRate} color="bg-gradient-to-r from-violet-400 to-pink-300" />
                      </div>
                    </Section>
                    <Section title="Failed interview review" subtitle="Lowest scores that may need admin attention" icon={XCircle}>
                      <div className="space-y-3">
                        {failedInterviews.map((item) => (
                          <div
                            key={`${item.userId}-${item.interviewScore}`}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white/45 p-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-black text-[#2b2450]">{item.name}</p>
                              <p className="truncate text-xs text-[#958cb0]">{item.userId}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-black text-pink-600">
                                {item.interviewScore >= 0 ? item.interviewScore : "N/A"}/100
                              </span>
                              <Link
                                href={`/profile/${item.userId}`}
                                className="rounded-xl border border-violet-100 bg-white/60 px-3 py-2 text-xs font-black text-violet-600 hover:bg-violet-50"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        ))}
                        {!failedInterviews.length && (
                          <p className="text-sm text-[#8b83a8]">No failed interviews found.</p>
                        )}
                      </div>
                    </Section>
                  </div>
                )}

                {active === "Finance" && (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      title="Revenue"
                      value={formatMoney(totals?.revenue || 0)}
                      detail="Paid credit purchases"
                      icon={CircleDollarSign}
                      accent="bg-gradient-to-br from-violet-100 to-blue-100 text-violet-600"
                    />
                    <MetricCard
                      title="Purchases"
                      value={formatNumber(totals?.purchases || 0)}
                      detail="Credit purchase records"
                      icon={CheckCircle2}
                      accent="bg-gradient-to-br from-blue-100 to-violet-100 text-violet-600"
                    />
                    <MetricCard
                      title="Live credits"
                      value={formatNumber(totals?.totalCredits || 0)}
                      detail="Credits held by users"
                      icon={Sparkles}
                      accent="bg-gradient-to-br from-pink-100 to-fuchsia-100 text-pink-600"
                    />
                    <MetricCard
                      title="Awarded credits"
                      value={formatNumber(totals?.awardedCredits || 0)}
                      detail="Positive credit transactions"
                      icon={TrendingUp}
                      accent="bg-gradient-to-br from-violet-100 to-pink-100 text-violet-600"
                    />
                  </div>
                )}

                {active === "Settings" && (
                  <Section title="Admin controls" subtitle="Operational shortcuts and account actions" icon={Settings}>
                    <div className="grid gap-3 md:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => void loadAdminSummary()}
                        className="rounded-2xl border border-white/70 bg-white/50 p-4 text-left shadow-sm transition hover:bg-white/75"
                      >
                        <RefreshCw size={18} className="mb-3 text-violet-500" />
                        <p className="font-black text-[#2b2450]">Refresh analytics</p>
                        <p className="mt-1 text-sm text-[#8b83a8]">Reload admin summary from Firestore.</p>
                      </button>
                      <Link
                        href="/dashboard"
                        className="rounded-2xl border border-white/70 bg-white/50 p-4 text-left shadow-sm transition hover:bg-white/75"
                      >
                        <Home size={18} className="mb-3 text-violet-500" />
                        <p className="font-black text-[#2b2450]">Open user dashboard</p>
                        <p className="mt-1 text-sm text-[#8b83a8]">Inspect the logged-in dashboard experience.</p>
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-2xl border border-white/70 bg-white/50 p-4 text-left shadow-sm transition hover:bg-white/75"
                      >
                        <LogOut size={18} className="mb-3 text-violet-500" />
                        <p className="font-black text-[#2b2450]">Secure logout</p>
                        <p className="mt-1 text-sm text-[#8b83a8]">Clear session cookie and Firebase session.</p>
                      </button>
                    </div>
                  </Section>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
