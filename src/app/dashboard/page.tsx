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
  ClipboardCheck,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  CheckCircle2,
  XCircle,
  X,
  Clock3,
  ArrowRightLeft,
  UserRound,
  MessageSquare,
  Video,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import ChipLoader from "@/app/components/loader/page";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/app/components/innernavbar/page";
import Modal from "@/app/Modals/profilemodal/page";
import { auth, db } from "@/app/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { showErrorToast } from "@/app/lib/authToast";
import { toMillis } from "@/app/lib/skill-request-utils";

type ConnectRequestItem = {
  id: string;
  fromUserId?: string;
  toUserId?: string;
  senderId?: string;
  receiverId?: string;
  senderName?: string | null;
  receiverName?: string | null;
  fromUserName?: string | null;
  peerId?: string;
  peerName?: string | null;
  users?: string[];
  offeredSkill?: string;
  requestedSkill?: string;
  message?: string | null;
  schedule?: string | null;
  duration?: string | null;
  status?: string;
  connectionId?: string | null;
  chatEnabled?: boolean;
  createdAt?: unknown;
  acceptedAt?: unknown;
};

type DashboardNotification = {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  fromUserId?: string;
  fromUserName?: string | null;
  senderId?: string;
  senderName?: string | null;
  receiverId?: string;
  offeredSkill?: string;
  requestedSkill?: string;
  requestId?: string;
  connectRequestId?: string;
  status?: string;
  read?: boolean;
  createdAt?: unknown;
};

type DashboardSession = {
  id: string;
  learnerId?: string;
  providerId?: string;
  requesterId?: string;
  acceptedBy?: string;
  topic?: string;
  dateTime?: unknown;
  meetingDateTime?: unknown;
  duration?: number;
  status?: string;
  meetingStatus?: string;
  joinUrl?: string | null;
  startUrl?: string | null;
  canOpenMeeting?: boolean;
  meetingStartsInMs?: number | null;
  expired?: boolean;
};

type WrongAnswerItem = {
  index: number;
  question: string;
  expected: string | null;
  given: string | null;
};

type ProfileDoc = {
  fullName?: string;
  name?: string;
  displayName?: string;
  email?: string;
  location?: string;
  phone?: string;
  bio?: string;
  photoURL?: string | null;
  photoUpdatedAt?: number;
  enrolled?: boolean;
  profileCompleted?: boolean;
  completedSteps?: number[];
  interviewStatus?: string;
  interviewScore?: number;
  educations?: Array<{
    degree?: string;
    institute?: string;
    start?: string;
    end?: string;
  }>;
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

const analyticsColors = ["#06b6d4", "#f59e0b", "#10b981", "#8b5cf6"];

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

const SHOW_LEGACY_ANALYTICS = false;

function getRequestBadge(status?: string) {
  switch (status) {
    case "accepted":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "rejected":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

function formatSessionDate(value: unknown) {
  const millis = toMillis(value);
  if (!millis) return "Time not selected";
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(millis);
}

function formatStartsIn(value?: number | null) {
  if (value == null) return "";
  if (value <= 0) return "Ready to join";
  const minutes = Math.ceil(value / 60000);
  if (minutes < 60) return `Starts in ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `Starts in ${hours}h ${minutes % 60}m`;
}

export default function UserDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "profile" | "sessions" | "requests" | "chats" | "notifications" | "analytics"
  >("overview");
  const [incomingRequests, setIncomingRequests] = useState<
    ConnectRequestItem[]
  >([]);
  const [outgoingRequests, setOutgoingRequests] = useState<
    ConnectRequestItem[]
  >([]);
  const [connectLoading, setConnectLoading] = useState<boolean>(false);
  const [respondingTo, setRespondingTo] = useState<Record<string, boolean>>({});
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [myProfile, setMyProfile] = useState<ProfileDoc | null>(null);
  const [myProfileLoading, setMyProfileLoading] = useState<boolean>(false);
  const [editProfileOpen, setEditProfileOpen] = useState<boolean>(false);
  const [viewProfileOpen, setViewProfileOpen] = useState<boolean>(false);
  const [activeConnections, setActiveConnections] = useState<
    ConnectRequestItem[]
  >([]);
  const [dashboardNotifications, setDashboardNotifications] = useState<
    DashboardNotification[]
  >([]);
  const [sessions, setSessions] = useState<DashboardSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] =
    useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1400);
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
        Array.isArray(data?.incoming)
          ? (data.incoming as ConnectRequestItem[])
          : [],
      );
      setOutgoingRequests(
        Array.isArray(data?.outgoing)
          ? (data.outgoing as ConnectRequestItem[])
          : [],
      );
      setActiveConnections(
        Array.isArray(data?.connections)
          ? (data.connections as ConnectRequestItem[])
          : [],
      );
    } catch (err) {
      console.error("Failed to load connect requests:", err);
      showErrorToast("Requests could not be loaded", "Please refresh and try again.");
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setActiveConnections([]);
    } finally {
      setConnectLoading(false);
    }
  };

  const loadDashboardNotifications = async (uid: string) => {
    setNotificationsLoading(true);
    try {
      const res = await fetch(
        `/api/notifications/combined-v3?userId=${uid}&limit=8`,
        {
          cache: "no-store",
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.error || "Failed to load notifications");

      setDashboardNotifications(
        Array.isArray(data?.notifications)
          ? (data.notifications as DashboardNotification[])
          : [],
      );
    } catch (err) {
      console.error("Failed to load dashboard notifications:", err);
      showErrorToast("Notifications could not be loaded", "Please refresh and try again.");
      setDashboardNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/sessions", {
        cache: "no-store",
        headers: {
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load sessions");
      setSessions(Array.isArray(data?.sessions) ? (data.sessions as DashboardSession[]) : []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
      showErrorToast("Sessions could not be loaded", "Please refresh and try again.");
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadMyProfile = async (uid: string) => {
    setMyProfileLoading(true);
    try {
      const [profileSnap, userSnap] = await Promise.all([
        getDoc(doc(db, "profiles", uid)),
        getDoc(doc(db, "users", uid)),
      ]);
      const profileData = profileSnap.exists()
        ? (profileSnap.data() as ProfileDoc)
        : {};
      const userData = userSnap.exists()
        ? (userSnap.data() as ProfileDoc)
        : {};
      setMyProfile({
        ...userData,
        ...profileData,
        fullName:
          profileData.fullName ||
          profileData.name ||
          userData.fullName ||
          userData.name ||
          userData.displayName ||
          userData.email?.split("@")[0] ||
          "",
        email: profileData.email || userData.email,
      });
    } catch (err) {
      console.error("Failed to load my profile:", err);
      setMyProfile(null);
    } finally {
      setMyProfileLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    loadProfilesMap();
    loadConnectRequests(userId);
    loadDashboardNotifications(userId);
    loadSessions();
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setMyProfile(null);
      return;
    }

    loadMyProfile(userId);
  }, [userId]);

  const respond = async (fromUserId: string, action: "accept" | "reject") => {
    if (!userId) return;
    if (respondingTo[fromUserId]) return;

    setRespondingTo((prev) => ({ ...prev, [fromUserId]: true }));
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/connect-requests/respond", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ fromUserId, toUserId: userId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to respond");

      await loadConnectRequests(userId);
      await loadSessions();
    } catch (err) {
      console.error("Respond failed:", err);
      showErrorToast(
        action === "accept" ? "Request could not be accepted" : "Request could not be rejected",
        err instanceof Error ? err.message : "Failed to respond.",
      );
    } finally {
      setRespondingTo((prev) => ({ ...prev, [fromUserId]: false }));
    }
  };

  const getPeerId = (request: ConnectRequestItem) => {
    if (request.peerId) return request.peerId;
    if (request.senderId && request.senderId !== userId) return request.senderId;
    if (request.fromUserId && request.fromUserId !== userId) return request.fromUserId;
    if (request.receiverId && request.receiverId !== userId) return request.receiverId;
    if (request.toUserId && request.toUserId !== userId) return request.toUserId;
    return request.users?.find((id) => id && id !== userId) || "";
  };

  const getPeerName = (request: ConnectRequestItem, fallback = "User") => {
    const peerId = getPeerId(request);
    const directionName =
      request.senderId === userId || request.fromUserId === userId
        ? request.receiverName
        : request.receiverId === userId || request.toUserId === userId
          ? request.senderName || request.fromUserName
          : null;
    return (
      request.peerName ||
      directionName ||
      profileNames[peerId] ||
      peerId ||
      fallback
    );
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout cookie clear failed:", err);
    }
    await signOut(auth);
    router.push("/signin");
  };

  const getSessionPeerName = (session: DashboardSession) => {
    const isProvider = userId === session.providerId || userId === session.acceptedBy;
    const peerId = isProvider
      ? session.learnerId || session.requesterId || ""
      : session.providerId || session.acceptedBy || "";
    return profileNames[peerId] || peerId || "User";
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const matchesSearch = (...values: Array<unknown>) => {
    if (!normalizedSearch) return true;
    return values
      .filter((value) => value != null)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  };

  const filteredIncomingRequests = incomingRequests.filter((request) =>
    matchesSearch(
      getPeerName(request),
      request.offeredSkill,
      request.requestedSkill,
      request.message,
      request.status,
    ),
  );
  const filteredOutgoingRequests = outgoingRequests.filter((request) =>
    matchesSearch(
      getPeerName(request),
      request.offeredSkill,
      request.requestedSkill,
      request.message,
      request.status,
    ),
  );
  const filteredActiveConnections = activeConnections.filter((connection) =>
    matchesSearch(
      getPeerName(connection),
      connection.offeredSkill,
      connection.requestedSkill,
      connection.status,
    ),
  );
  const filteredSessions = sessions.filter((session) =>
    matchesSearch(
      session.topic,
      session.status,
      session.meetingStatus,
      getSessionPeerName(session),
    ),
  );
  const filteredNotifications = dashboardNotifications.filter((notification) =>
    matchesSearch(
      notification.title,
      notification.message,
      notification.fromUserName,
      notification.senderName,
      notification.offeredSkill,
      notification.requestedSkill,
      notification.status,
      notification.type,
    ),
  );

  const allRequests = [...incomingRequests, ...outgoingRequests];
  const requestStatusCounts = allRequests.reduce(
    (acc, request) => {
      const status = String(request.status || "pending").toLowerCase();
      if (status === "accepted") acc.accepted += 1;
      else if (status === "rejected") acc.rejected += 1;
      else acc.pending += 1;
      return acc;
    },
    { accepted: 0, pending: 0, rejected: 0 },
  );
  const activeSessions = sessions.filter(
    (session) =>
      !["completed", "cancelled", "rejected"].includes(
        String(session.status || "").toLowerCase(),
      ),
  );
  const completedSessions = sessions.filter(
    (session) => String(session.status || "").toLowerCase() === "completed",
  );
  const unreadNotificationsCount = dashboardNotifications.filter(
    (notification) => !notification.read,
  ).length;
  const profileCompletion = myProfile?.profileCompleted
    ? 100
    : Math.min(100, ((myProfile?.completedSteps?.length || 0) / 4) * 100);
  const interviewScore =
    typeof myProfile?.interview?.score === "number"
      ? myProfile.interview.score
      : typeof myProfile?.interviewScore === "number"
        ? myProfile.interviewScore
        : 0;
  const requestSuccessRate = allRequests.length
    ? Math.round((requestStatusCounts.accepted / allRequests.length) * 100)
    : 0;
  const allProfileSkills = [
    ...(myProfile?.skills?.teachSkills || []),
    ...(myProfile?.skills?.customTeachSkills || []),
    ...(myProfile?.skills?.learnSkills || []),
    ...(myProfile?.skills?.customLearnSkills || []),
  ].filter(Boolean);
  const skillCounts = allProfileSkills.reduce<Record<string, number>>(
    (acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    },
    {},
  );
  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5);
  const analyticsDistribution = [
    { name: "Sessions", value: sessions.length, color: analyticsColors[0] },
    { name: "Requests", value: allRequests.length, color: analyticsColors[1] },
    { name: "Chats", value: activeConnections.length, color: analyticsColors[2] },
    {
      name: "Notifications",
      value: dashboardNotifications.length,
      color: analyticsColors[3],
    },
  ].filter((item) => item.value > 0);
  const analyticsPieData = analyticsDistribution.length
    ? analyticsDistribution
    : [{ name: "No activity", value: 1, color: "#cbd5e1" }];
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
  const analyticsActivityData = lastSevenDays.map((date) => {
    const start = date.getTime();
    const end = start + 24 * 60 * 60 * 1000;
    const inDay = (value: unknown) => {
      const millis = toMillis(value);
      return Boolean(millis && millis >= start && millis < end);
    };

    return {
      day: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
      sessions: sessions.filter((session) =>
        inDay(session.dateTime || session.meetingDateTime),
      ).length,
      requests: allRequests.filter((request) =>
        inDay(request.createdAt || request.acceptedAt),
      ).length,
      notifications: dashboardNotifications.filter((notification) =>
        inDay(notification.createdAt),
      ).length,
    };
  });
  const nextSessions = activeSessions
    .slice()
    .sort(
      (a, b) =>
        (toMillis(a.dateTime || a.meetingDateTime) || Number.MAX_SAFE_INTEGER) -
        (toMillis(b.dateTime || b.meetingDateTime) || Number.MAX_SAFE_INTEGER),
    )
    .slice(0, 4);

  const myProfilePhotoURL =
    myProfile?.photoURL && !myProfile.photoURL.startsWith("blob:")
      ? myProfile.photoURL.startsWith("data:")
      ? myProfile.photoURL
      : `${myProfile.photoURL}${myProfile.photoUpdatedAt ? `?v=${myProfile.photoUpdatedAt}` : ""}`
      : "";
  const dashboardName =
    myProfile?.fullName ||
    myProfile?.name ||
    myProfile?.displayName ||
    myProfile?.email?.split("@")[0] ||
    "there";
  const activeTitle =
    {
      overview: `Welcome ${dashboardName}!`,
      profile: "My Profile",
      sessions: "My Sessions",
      requests: "Skill Requests",
      chats: "Active Chats",
      notifications: "Notifications",
      analytics: `Welcome ${dashboardName}!`,
    }[activeTab] || "Dashboard";

  const handleOpenNotifications = async () => {
    setActiveTab("notifications");
    if (userId) {
      await loadDashboardNotifications(userId);
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
      <div className="min-h-screen bg-gradient-to-br from-[#fbc2eb] to-purple-600 px-3 py-4 font-sans text-slate-700 sm:p-6">
        <Navbar />
        <div className="mx-auto mt-14 flex min-h-[calc(100dvh-5.5rem)] max-w-[1400px] flex-col overflow-hidden rounded-[24px] border border-white/40 bg-white/30 shadow-2xl backdrop-blur-xl md:flex-row md:rounded-[40px]">
          {/* --- SIDEBAR --- */}
          <aside className="w-full border-b border-white/20 bg-white/20 p-4 backdrop-blur-lg md:w-64 md:border-b-0 md:border-r md:p-8">
            <div className="mb-4 flex items-center gap-3 md:mb-10 md:flex-col">
              <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center mb-2 shadow-inner">
                <Users className="text-indigo-600" size={24} />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-900/60">
                Skill Swap
              </h2>
            </div>

            <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:block md:space-y-2 md:overflow-visible md:px-0 md:pb-0">
              {[
                {
                  name: "Overview",
                  icon: LayoutDashboard,
                  tab: "overview" as const,
                },
                { name: "View Profile", icon: Users, tab: "profile" as const },
                { name: "Sessions", icon: CalendarCheck, tab: "sessions" as const },
                { name: "Requests", icon: ClipboardCheck, tab: "requests" as const },
                { name: "Chats", icon: MessageSquare, tab: "chats" as const },
                { name: "Notifications", icon: Bell, tab: "notifications" as const },
              ].map((item) => (
                <div
                  key={item.name}
                  onClick={() => setActiveTab(item.tab)}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2.5 cursor-pointer transition-all md:gap-4 md:px-4 md:py-3 ${
                    item.tab === activeTab
                        ? "bg-gradient-to-r from-blue-100/50 to-purple-100/50 shadow-sm border border-white/50 text-indigo-700"
                        : "text-slate-500 hover:bg-white/20"
                  }`}
                >
                  <item.icon
                    size={20}
                    className={
                      item.tab === activeTab ? "text-indigo-600" : ""
                    }
                  />
                  <span className="whitespace-nowrap text-xs font-semibold md:text-sm">{item.name}</span>
                </div>
              ))}
            </nav>
          </aside>

          {/* --- MAIN CONTENT --- */}
          <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {/* TOP BAR */}
            <header className="mb-6 flex items-center justify-between sm:mb-8">
              <div className="flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                {/* Search Bar - Full width on mobile, half on desktop */}
                <div className="relative w-full md:w-1/2">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search dashboard"
                    className="w-full bg-white/40 border border-white/60 rounded-full py-2.5 pl-12 pr-4 outline-none focus:ring-2 ring-purple-200 transition-all text-sm placeholder:text-slate-400"
                  />
                </div>

                {/* Icons & Actions - Wraps or shrinks on small screens */}
                <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:justify-end md:gap-6">
                  <button
                    type="button"
                    onClick={handleOpenNotifications}
                    disabled={notificationsLoading}
                    className="group relative flex items-center gap-3 rounded-full border border-white/60 bg-white/65 px-3 py-2 shadow-sm transition hover:bg-white hover:shadow-md disabled:cursor-wait disabled:opacity-70"
                    aria-label={`Open notifications${unreadNotificationsCount ? `, ${unreadNotificationsCount} unread` : ""}`}
                  >
                    <img
                      src={myProfilePhotoURL || "https://i.pravatar.cc/150?u=me"}
                      className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm"
                      alt={myProfile?.fullName || "Profile"}
                    />
                    {/* Label hidden on very small screens to save space */}
                    <span className="hidden sm:flex flex-col items-start leading-tight">
                      <span className="text-sm font-bold text-slate-700">
                        Notifications
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {notificationsLoading
                          ? "Refreshing..."
                          : unreadNotificationsCount
                            ? `${unreadNotificationsCount} unread`
                            : "All caught up"}
                      </span>
                    </span>
                    <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                      <Bell size={19} />
                      {unreadNotificationsCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                          {unreadNotificationsCount > 9
                            ? "9+"
                            : unreadNotificationsCount}
                        </span>
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-slate-600 font-bold text-sm hover:text-red-500 transition-colors"
                  >
                    <span className="hidden sm:inline">Logout</span>{" "}
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </header>

            <h1 className="mb-5 break-words text-2xl font-bold text-slate-800 sm:mb-6 sm:text-3xl">
              {activeTitle}
            </h1>

            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                {[
                  {
                    label: "Upcoming Sessions",
                    value: filteredSessions.filter((session) => !["completed", "cancelled", "rejected"].includes(String(session.status || ""))).length,
                    icon: Video,
                    tab: "sessions" as const,
                  },
                  {
                    label: "Pending Requests",
                    value: filteredIncomingRequests.filter((request) => request.status === "pending").length,
                    icon: ArrowRightLeft,
                    tab: "requests" as const,
                  },
                  {
                    label: "Accepted Requests",
                    value: requestStatusCounts.accepted,
                    icon: CheckCircle2,
                    tab: "requests" as const,
                  },
                  {
                    label: "Active Chats",
                    value: filteredActiveConnections.length,
                    icon: MessageSquare,
                    tab: "chats" as const,
                  },
                  {
                    label: "Unread Alerts",
                    value: unreadNotificationsCount,
                    icon: Bell,
                    tab: "notifications" as const,
                  },
                  {
                    label: "Profile Status",
                    value: myProfile ? "Ready" : "Missing",
                    icon: UserRound,
                    tab: "profile" as const,
                  },
                  {
                    label: "Interview",
                    value: myProfile?.interview?.result || myProfile?.interviewStatus || "Pending",
                    icon: Sparkles,
                    tab: "overview" as const,
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setActiveTab(item.tab)}
                    className="min-w-0 rounded-[22px] border border-white/60 bg-white/45 p-4 text-left shadow-sm transition hover:bg-white/65 hover:shadow-md sm:rounded-[28px] sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          {item.label}
                        </p>
                        <p className="mt-2 break-words text-xl font-black text-slate-800 sm:text-2xl">
                          {item.value}
                        </p>
                      </div>
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-purple-600 shadow-sm">
                        <item.icon size={22} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* MY PROFILE */}
            {activeTab === "profile" && (
              <div className="mb-6 rounded-[22px] border border-white/60 bg-white/40 p-4 shadow-sm sm:mb-8 sm:rounded-[30px] sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <img
                      src={
                        myProfilePhotoURL || "https://i.pravatar.cc/150?u=me"
                      }
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

                  <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setEditProfileOpen(true)}
                      className="flex-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-105 sm:flex-none cursor-pointer"
                    >
                      Edit Profile
                    </button>
                    {userId && (
                      <button
                        type="button"
                        onClick={() => setViewProfileOpen(true)}
                        className="flex-1 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 sm:flex-none cursor-pointer"
                      >
                        View Public
                      </button>
                    )}
                  </div>
                </div>

                {myProfileLoading && (
                  <p className="mt-4 text-sm text-slate-600">
                    Loading profile...
                  </p>
                )}

                {!myProfileLoading && !myProfile && (
                  <p className="mt-4 text-sm text-slate-600">
                    You are not enrolled yet. Use the Enroll Now button to
                    create your profile and take the AI interview.
                  </p>
                )}

                {!myProfileLoading && myProfile && (
                  <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="min-w-0 rounded-2xl border border-white/60 bg-white/50 p-4">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        About
                      </p>
                      <p className="mt-2 break-words text-sm text-slate-700">
                        {myProfile.bio || "—"}
                      </p>
                      <p className="mt-3 text-xs text-slate-600">
                        {myProfile.location
                          ? `Location: ${myProfile.location}`
                          : ""}
                      </p>
                      <p className="text-xs text-slate-600">
                        {myProfile.phone ? `Phone: ${myProfile.phone}` : ""}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-2xl border border-white/60 bg-white/50 p-4">
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

                    <div className="min-w-0 rounded-2xl border border-white/60 bg-white/50 p-4">
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
                                    <span className="text-slate-500">
                                      Your:
                                    </span>{" "}
                                    {w.given || "—"}
                                  </p>
                                  <p>
                                    <span className="text-slate-500">
                                      Correct:
                                    </span>{" "}
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
            )}

            {activeTab === "sessions" && (
              <>
                <div className="mb-6 rounded-[22px] border border-white/60 bg-white/40 p-4 shadow-sm sm:rounded-[30px] sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Video size={18} className="text-purple-600" />
                        Upcoming Sessions
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Zoom links unlock at meeting time for booked users.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full bg-white/70 border border-white/70 text-slate-700 hover:bg-white transition"
                      onClick={() => loadSessions()}
                    >
                      <Clock3 size={14} />
                      Refresh
                    </button>
                  </div>

                  {sessionsLoading && <p className="text-sm text-slate-600">Loading sessions...</p>}
                  {!sessionsLoading && filteredSessions.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-white/70 bg-white/50 p-5 text-sm text-slate-600">
                      {normalizedSearch ? "No sessions match your search." : "No upcoming sessions yet."}
                    </div>
                  )}
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filteredSessions
                      .filter((session) => !["completed", "cancelled", "rejected"].includes(String(session.status || "")))
                      .slice(0, 6)
                      .map((session) => {
                        const isProvider = userId === session.providerId || userId === session.acceptedBy;
                        const meetingUrl = isProvider ? session.startUrl : session.joinUrl;
                        return (
                          <div
                            key={session.id}
                            className="min-w-0 rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 truncate">
                                  {session.topic || "Skill Swap Meeting"}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {isProvider ? "Learner" : "Provider"}: {getSessionPeerName(session)}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                {session.status || "scheduled"}
                              </span>
                            </div>
                            <div className="mt-3 space-y-1 text-xs text-slate-600">
                              <p>{formatSessionDate(session.dateTime || session.meetingDateTime)}</p>
                              <p>{session.duration || 30} minutes</p>
                              <p className="font-semibold text-purple-700">
                                {formatStartsIn(session.meetingStartsInMs)}
                              </p>
                            </div>
                            <a
                              href={meetingUrl || "#"}
                              target="_blank"
                              rel="noreferrer"
                              aria-disabled={!session.canOpenMeeting || !meetingUrl}
                              onClick={(event) => {
                                if (!session.canOpenMeeting || !meetingUrl) event.preventDefault();
                              }}
                              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                                session.canOpenMeeting && meetingUrl
                                  ? "bg-slate-900 text-white hover:bg-slate-800"
                                  : "cursor-not-allowed bg-slate-100 text-slate-400"
                              }`}
                            >
                              <Video size={14} />
                              {isProvider ? "Start Meeting" : "Join Meeting"}
                            </a>
                          </div>
                        );
                      })}
                  </div>
                </div>

              </>
            )}

            {activeTab === "requests" && (
              <>
                {/* CONNECT REQUESTS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="min-w-0 rounded-[22px] border border-white/60 bg-white/40 p-4 shadow-sm sm:rounded-[30px] sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                          <ArrowRightLeft
                            size={18}
                            className="text-purple-600"
                          />
                          Connection Requests
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Review who wants to connect with you.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full bg-white/70 border border-white/70 text-slate-700 hover:bg-white transition"
                        onClick={() => userId && loadConnectRequests(userId)}
                      >
                        <Clock3 size={14} />
                        Refresh
                      </button>
                    </div>

                    {!userId && (
                      <p className="text-sm text-slate-600">
                        Please sign in to view requests.
                      </p>
                    )}

                    {userId && connectLoading && (
                      <p className="text-sm text-slate-600">Loading...</p>
                    )}

                    {userId && !connectLoading && (
                      <div className="space-y-3">
                        {filteredIncomingRequests
                          .filter((r) => r.status === "pending")
                          .slice(0, 5)
                          .map((r) => (
                            <div
                              key={r.id}
                              className="bg-white/70 border border-white/70 rounded-3xl p-4 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                                  {getPeerName(r).charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-bold text-slate-800 truncate">
                                      {getPeerName(r)}
                                    </p>
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border ${getRequestBadge(
                                        r.status,
                                      )}`}
                                    >
                                      <Clock3 size={11} />
                                      {r.status || "pending"}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-1">
                                    wants to connect with you
                                  </p>
                                  <p className="text-xs text-slate-600 mt-2">
                                    Offer:{" "}
                                    <span className="font-semibold">
                                      {r.offeredSkill || "Not specified"}
                                    </span>{" "}
                                    · Learn:{" "}
                                    <span className="font-semibold">
                                      {r.requestedSkill || "Not specified"}
                                    </span>
                                  </p>
                                  {r.message && (
                                    <p className="text-xs text-slate-600 mt-2 bg-white/60 rounded-xl px-3 py-2">
                                      {r.message}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                                {getPeerId(r) && (
                                  <Link
                                    href={`/profile/${getPeerId(r)}`}
                                    className="inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-2xl bg-white border border-white/70 text-slate-700 hover:bg-slate-50 transition"
                                  >
                                    <UserRound size={14} />
                                    View
                                  </Link>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    getPeerId(r) &&
                                    respond(getPeerId(r), "accept")
                                  }
                                  disabled={!!respondingTo[r.id]}
                                  className="inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-2xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                                >
                                  <CheckCircle2 size={14} />
                                  {respondingTo[r.id] ? "Saving..." : "Accept"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    getPeerId(r) &&
                                    respond(getPeerId(r), "reject")
                                  }
                                  disabled={!!respondingTo[r.id]}
                                  className="inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-2xl bg-rose-600 text-white shadow-sm hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                                >
                                  <XCircle size={14} />
                                  {respondingTo[r.id] ? "Saving..." : "Reject"}
                                </button>
                              </div>
                            </div>
                          ))}

                        {filteredIncomingRequests.filter((r) => r.status === "pending")
                          .length === 0 && (
                          <div className="rounded-3xl border border-dashed border-white/70 bg-white/50 p-5 text-sm text-slate-600">
                            {normalizedSearch ? "No pending requests match your search." : "No pending requests right now."}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 rounded-[22px] border border-white/60 bg-white/40 p-4 shadow-sm sm:rounded-[30px] sm:p-6">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                          <Users size={18} className="text-purple-600" />
                          Sent Requests
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Track the requests you have already sent.
                        </p>
                      </div>
                    </div>
                    {!userId && (
                      <p className="text-sm text-slate-600">
                        Please sign in to view requests.
                      </p>
                    )}
                    {userId && connectLoading && (
                      <p className="text-sm text-slate-600">Loading...</p>
                    )}
                    {userId && !connectLoading && (
                      <div className="space-y-3">
                        {filteredOutgoingRequests.slice(0, 5).map((r) => (
                          <div
                            key={r.id}
                            className="bg-white/70 border border-white/70 rounded-3xl p-4 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                                {(profileNames[r.toUserId || ""] || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">
                                  {getPeerName(r)}
                                </p>
                                <div className="mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-700 border-slate-200">
                                  <Clock3 size={11} />
                                  {r.status || "pending"}
                                </div>
                                <p className="text-xs text-slate-600 mt-2">
                                  Offer:{" "}
                                  <span className="font-semibold">
                                    {r.offeredSkill || "Not specified"}
                                  </span>{" "}
                                  · Learn:{" "}
                                  <span className="font-semibold">
                                    {r.requestedSkill || "Not specified"}
                                  </span>
                                </p>
                                {r.message && (
                                  <p className="text-xs text-slate-600 mt-2 bg-white/60 rounded-xl px-3 py-2">
                                    {r.message}
                                  </p>
                                )}
                              </div>
                            </div>
                            {getPeerId(r) && (
                              <Link
                                href={`/profile/${getPeerId(r)}`}
                                className="inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-2xl bg-white border border-white/70 text-slate-700 hover:bg-slate-50 transition"
                              >
                                <UserRound size={14} />
                                View
                              </Link>
                            )}
                          </div>
                        ))}

                        {filteredOutgoingRequests.length === 0 && (
                          <div className="rounded-3xl border border-dashed border-white/70 bg-white/50 p-5 text-sm text-slate-600">
                            {normalizedSearch ? "No sent requests match your search." : "No sent requests yet."}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </>
            )}

            {activeTab === "chats" && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="min-w-0 rounded-[22px] border border-white/60 bg-white/40 p-4 shadow-sm sm:rounded-[30px] sm:p-6 lg:col-span-3">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                          <MessageSquare
                            size={18}
                            className="text-purple-600"
                          />
                          Active Chats
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Accepted requests automatically unlock chat access.
                        </p>
                      </div>
                    </div>

                    {userId && connectLoading && (
                      <p className="text-sm text-slate-600">Loading chats...</p>
                    )}

                    {userId &&
                      !connectLoading &&
                      filteredActiveConnections.length === 0 && (
                        <div className="rounded-3xl border border-dashed border-white/70 bg-white/50 p-5 text-sm text-slate-600">
                          {normalizedSearch ? "No active chats match your search." : "No active chats yet."}
                        </div>
                      )}

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {filteredActiveConnections.map((c) => {
                        const peerId = getPeerId(c);
                        const peerName = getPeerName(c);
                        const currentUserName = myProfile?.fullName || "You";
                        return (
                          <div
                            key={c.id}
                            className="flex min-w-0 flex-col gap-3 rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">
                                {currentUserName} to {peerName}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1">
                                {c.offeredSkill || "Skill"} ↔{" "}
                                {c.requestedSkill || "Skill"}
                              </p>
                            </div>
                            {peerId && (
                              <Link
                                href={`/chating?connectionId=${encodeURIComponent(c.id)}&peer=${encodeURIComponent(peerId)}`}
                                className="inline-flex w-full items-center justify-center gap-1 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                              >
                                <MessageSquare size={14} />
                                Chat
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </>
            )}

            {activeTab === "notifications" && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="min-w-0 rounded-[22px] border border-white/60 bg-white/40 p-4 shadow-sm sm:rounded-[30px] sm:p-6 lg:col-span-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                          <Bell
                            size={18}
                            className="text-purple-600 shrink-0"
                          />
                          Notifications
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Recent request updates and skill swap alerts.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="flex items-center justify-center gap-1.5 px-4 py-2 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-full bg-white/70 border border-white/70 text-slate-700 hover:bg-white transition-all shrink-0 w-fit"
                        onClick={() =>
                          userId && loadDashboardNotifications(userId)
                        }
                      >
                        <Clock3 size={14} />
                        <span className="leading-none">Refresh</span>
                      </button>
                    </div>

                    {userId && notificationsLoading && (
                      <p className="text-sm text-slate-600">Loading...</p>
                    )}

                    {userId &&
                      !notificationsLoading &&
                      filteredNotifications.length === 0 && (
                        <div className="rounded-3xl border border-dashed border-white/70 bg-white/50 p-5 text-sm text-slate-600">
                          {normalizedSearch ? "No notifications match your search." : "No notifications yet."}
                        </div>
                      )}

                    <div className="space-y-3">
                      {filteredNotifications.map((notification) => {
                        const peerId =
                          notification.fromUserId ||
                          notification.senderId ||
                          notification.receiverId ||
                          "";
                        const peerName =
                          notification.fromUserName ||
                          notification.senderName ||
                          profileNames[peerId] ||
                          "User";

                        return (
                          <div
                            key={notification.id}
                            className="flex min-w-0 flex-col gap-3 rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-slate-800 truncate">
                                  {notification.title || "Notification"}
                                </p>
                                {!notification.read && (
                                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 break-words text-xs text-slate-500">
                                {notification.message ||
                                  "You have a new update."}
                              </p>
                              {notification.offeredSkill ||
                              notification.requestedSkill ? (
                                <p className="text-[11px] text-slate-500 mt-2">
                                  {peerName} ·{" "}
                                  {notification.offeredSkill || "Skill"} ↔{" "}
                                  {notification.requestedSkill || "Skill"}
                                </p>
                              ) : null}
                            </div>

                            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                              {peerId && (
                                <Link
                                  href={`/profile/${peerId}`}
                                  className="inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-2xl bg-white border border-white/70 text-slate-700 hover:bg-slate-50 transition"
                                >
                                  <UserRound size={14} />
                                  View
                                </Link>
                              )}
                              {!notification.read && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await fetch("/api/notifications", {
                                      method: "PATCH",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        notificationId: notification.id,
                                        userId,
                                      }),
                                    });
                                    if (userId) {
                                      await loadDashboardNotifications(userId);
                                    }
                                  }}
                                  className="inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </>
            )}

            {activeTab === "overview" && (
              <>
                <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="min-w-0 rounded-[24px] border border-white/70 bg-white/60 p-5 shadow-sm sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800">Activity Mix</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Live totals from your dashboard.
                        </p>
                      </div>
                      <span className="text-2xl font-black text-slate-900">
                        {sessions.length + allRequests.length + activeConnections.length}
                      </span>
                    </div>
                    <div className="relative mt-4 h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsPieData}
                            innerRadius={48}
                            outerRadius={68}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analyticsPieData.map((entry, index) => (
                              <Cell key={`analytics-cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {analyticsPieData.map((item) => (
                        <span
                          key={item.name}
                          className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-slate-600"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.name}: {analyticsDistribution.length ? item.value : 0}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-0 rounded-[24px] border border-white/70 bg-white/60 p-5 shadow-sm sm:p-6">
                    <h3 className="font-bold text-slate-800">Profile Health</h3>
                    <div className="mt-5 space-y-4">
                      {[
                        { label: "Profile Completion", value: Math.round(profileCompletion), color: "bg-cyan-500" },
                        { label: "Interview Score", value: interviewScore, color: "bg-violet-500" },
                        { label: "Request Success", value: requestSuccessRate, color: "bg-emerald-500" },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                            <span>{item.label}</span>
                            <span>{item.value}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/80">
                            <div
                              className={`h-full rounded-full ${item.color}`}
                              style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200">
                        Interview
                      </p>
                      <p className="mt-2 text-lg font-black">
                        {myProfile?.interview?.result || myProfile?.interviewStatus || "Not attempted"}
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        {typeof myProfile?.interview?.correct === "number" &&
                        typeof myProfile?.interview?.total === "number"
                          ? `${myProfile.interview.correct}/${myProfile.interview.total} correct answers`
                          : "Take the interview to unlock detailed scoring."}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-[24px] border border-white/70 bg-white/60 p-5 shadow-sm sm:p-6">
                    <h3 className="font-bold text-slate-800">Your Skills</h3>
                    <div className="mt-4 space-y-3">
                      {topSkills.length > 0 ? (
                        topSkills.map(([skill, count], index) => (
                          <div key={skill} className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 text-xs font-black text-white">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {skill}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {count > 1 ? `${count} mentions` : "Added to profile"}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/70 bg-white/60 p-4 text-sm text-slate-600">
                          Add skills in your profile to see skill insights here.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="min-w-0 overflow-hidden rounded-[24px] border border-white/70 bg-white/60 p-5 shadow-sm sm:p-6 lg:col-span-2">
                    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800">
                          Last 7 Days Activity
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Sessions, requests, and notifications by day.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (userId) {
                            loadConnectRequests(userId);
                            loadSessions();
                            loadDashboardNotifications(userId);
                          }
                        }}
                        className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-white"
                      >
                        <Clock3 size={14} />
                        Refresh overview
                      </button>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsActivityData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: "bold" }} />
                          <YAxis width={28} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: "bold" }} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "14px",
                              border: "1px solid #e2e8f0",
                              boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
                            }}
                          />
                          <Line type="monotone" dataKey="sessions" stroke="#06b6d4" strokeWidth={3} dot={false} />
                          <Line type="monotone" dataKey="requests" stroke="#f59e0b" strokeWidth={3} dot={false} />
                          <Line type="monotone" dataKey="notifications" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center gap-4 text-[11px] font-bold text-slate-600">
                      <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-cyan-500" />Sessions</span>
                      <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500" />Requests</span>
                      <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-violet-500" />Notifications</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[24px] border border-white/70 bg-white/60 p-5 shadow-sm sm:p-6">
                      <h3 className="font-bold text-slate-800">Request Pipeline</h3>
                      <div className="mt-4 space-y-4">
                        {[
                          { label: "Accepted", value: requestStatusCounts.accepted, color: "bg-emerald-500" },
                          { label: "Pending", value: requestStatusCounts.pending, color: "bg-amber-500" },
                          { label: "Rejected", value: requestStatusCounts.rejected, color: "bg-rose-500" },
                        ].map((item) => {
                          const percent = allRequests.length
                            ? Math.round((item.value / allRequests.length) * 100)
                            : 0;
                          return (
                            <div key={item.label}>
                              <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                                <span>{item.label}</span>
                                <span>{item.value}</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-white/80">
                                <div
                                  className={`h-full rounded-full ${item.color}`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/70 bg-white/60 p-5 shadow-sm sm:p-6">
                      <h3 className="font-bold text-slate-800">Next Sessions</h3>
                      <div className="mt-4 space-y-3">
                        {nextSessions.length > 0 ? (
                          nextSessions.map((session) => (
                            <div key={session.id} className="rounded-2xl bg-white/75 p-3 text-xs text-slate-600">
                              <p className="font-bold text-slate-800">
                                {session.topic || "Skill Swap Meeting"}
                              </p>
                              <p className="mt-1">
                                {formatSessionDate(session.dateTime || session.meetingDateTime)}
                              </p>
                              <p className="mt-1 font-semibold text-purple-700">
                                {formatStartsIn(session.meetingStartsInMs)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-xs text-slate-500">
                            No upcoming sessions scheduled.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {SHOW_LEGACY_ANALYTICS && activeTab === "analytics" && (
              <>
                {/* TOP GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Total Employees (Donut) */}
                  <div className="min-w-0 rounded-[22px] border border-white/60 bg-white/40 p-4 shadow-sm sm:rounded-[30px] sm:p-6">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h3 className="font-bold text-slate-700">
                        Total Employees
                      </h3>
                      <span className="text-2xl font-black text-slate-800">
                        32
                      </span>
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
                  <div className="min-w-0 rounded-[22px] border border-white/60 bg-white/40 p-4 shadow-sm sm:rounded-[30px] sm:p-6">
                    <h3 className="font-bold text-slate-700 mb-4">
                      Top Skills
                    </h3>
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
                        {
                          label: "Animation",
                          val: "78%",
                          color: "bg-blue-400",
                        },
                      ].map((skill) => (
                        <div
                          key={skill.label}
                          className="flex items-center gap-3"
                        >
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
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
                    <div className="relative flex items-center gap-3 overflow-hidden rounded-[22px] border border-white bg-gradient-to-br from-slate-100/80 to-slate-200/80 p-4 sm:gap-4 sm:rounded-[30px]">
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
                      <div className="absolute right-2 top-2 opacity-20">
                        🎈
                      </div>
                    </div>
                  </div>
                </div>
                {/* BOTTOM GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Weekly Activity Line Chart */}
                  <div className="min-w-0 overflow-hidden rounded-[22px] border border-white/60 bg-white/40 p-4 sm:rounded-[30px] sm:p-6 lg:col-span-2">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                      <h3 className="font-bold text-slate-700 text-base sm:text-lg">
                        Weekly Activity
                      </h3>

                      <button className="text-[10px] sm:text-xs bg-white/60 px-3 py-2 rounded-lg border border-white/40 font-bold flex items-center gap-2 w-fit self-start sm:self-auto">
                        December, 14 - 18th
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {/* Chart */}
                    <div className="h-52 sm:h-64 w-full -ml-3 sm:ml-0">
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
                            width={28}
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
                            strokeWidth={2}
                            dot={false}
                          />

                          <Line
                            type="monotone"
                            dataKey="illustration"
                            stroke="#FF85B8"
                            strokeWidth={2}
                            dot={false}
                          />

                          <Line
                            type="monotone"
                            dataKey="uiux"
                            stroke="#FFB347"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                        <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                        Animation
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                        <span className="w-3 h-3 rounded-full bg-pink-400"></span>
                        Illustration
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                        <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                        UI/UX Design
                      </div>
                    </div>
                  </div>

                  {/* Holiday / Calendar */}
                  <div className="space-y-6">
                    <div className="rounded-[22px] border border-white/60 bg-white/40 p-4 shadow-sm sm:rounded-[30px] sm:p-6">
                      <h3 className="font-bold text-sm mb-4">
                        Employees on holiday
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-100" />
                            <span className="text-xs font-bold">Unhealthy</span>
                          </div>
                          <span className="text-[10px] font-bold text-red-400">
                            Only today
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100" />
                            <span className="text-xs font-bold">
                              On holiday
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-red-400">
                            21st to 22nd
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mini Calendar mockup */}
                    <div className="rounded-[22px] border border-white bg-white/60 p-4 text-center shadow-sm sm:rounded-[30px]">
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
              </>
            )}
          </main>
        </div>
      </div>
      <AnimatePresence>
        {viewProfileOpen && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-4 backdrop-blur-md sm:items-center sm:py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setViewProfileOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 20, opacity: 0 }}
              transition={{ duration: 0.22 }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-hidden rounded-[28px] border border-white/50 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.25)] sm:max-h-[90vh]"
            >
              <div className="relative border-b border-slate-100 bg-gradient-to-r from-purple-700 to-pink-600 px-6 py-5 text-white">
                <button
                  type="button"
                  onClick={() => setViewProfileOpen(false)}
                  className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25 cursor-pointer"
                  aria-label="Close public profile preview"
                >
                  <X size={18} />
                </button>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="h-20 w-20 overflow-hidden rounded-3xl border border-white/25 bg-white/15 shadow-lg">
                    <img
                      src={
                        myProfilePhotoURL || "https://i.pravatar.cc/150?u=me"
                      }
                      alt={myProfile?.fullName || "Profile"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/75">
                      Public Preview
                    </p>
                    <h2 className="mt-1 text-2xl font-black leading-tight">
                      {myProfile?.fullName || "Profile"}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/90">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                        <UserRound size={14} />
                        {myProfile?.email || "No email"}
                      </span>
                      {myProfile?.location ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                          {myProfile.location}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 overflow-y-auto p-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800">About</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {myProfile?.bio || "No bio has been added yet."}
                    </p>
                    <div className="mt-4 space-y-1 text-sm text-slate-600">
                      <p>
                        {myProfile?.phone ? `Phone: ${myProfile.phone}` : ""}
                      </p>
                      <p>
                        {myProfile?.location
                          ? `Location: ${myProfile.location}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-800">
                      <Sparkles size={18} className="text-purple-600" />
                      <h4 className="font-bold">Education</h4>
                    </div>
                    <div className="mt-3 space-y-2">
                      {myProfile?.educations?.length ? (
                        myProfile.educations.map((edu, idx) => (
                          <div
                            key={`${edu.degree || "edu"}-${idx}`}
                            className="rounded-2xl bg-purple-50 px-3 py-2 text-sm text-purple-800"
                          >
                            <p className="font-semibold">
                              {edu.degree || "Education"}
                            </p>
                            <p className="text-xs text-purple-700/80">
                              {edu.institute || "Institute"}
                              {edu.start || edu.end
                                ? ` · ${edu.start || "?"} - ${edu.end || "?"}`
                                : ""}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Not set</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-800">
                      <CheckCircle2 size={17} className="text-emerald-600" />
                      <h4 className="font-bold">Skills Offered</h4>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        ...(myProfile?.skills?.teachSkills || []),
                        ...(myProfile?.skills?.customTeachSkills || []),
                      ].length ? (
                        [
                          ...(myProfile?.skills?.teachSkills || []),
                          ...(myProfile?.skills?.customTeachSkills || []),
                        ].map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Not set</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-800">
                      <GraduationCap size={17} className="text-purple-600" />
                      <h4 className="font-bold">Skills Wanted</h4>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        ...(myProfile?.skills?.learnSkills || []),
                        ...(myProfile?.skills?.customLearnSkills || []),
                      ].length ? (
                        [
                          ...(myProfile?.skills?.learnSkills || []),
                          ...(myProfile?.skills?.customLearnSkills || []),
                        ].map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Not set</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Modal
        open={editProfileOpen}
        setOpen={setEditProfileOpen}
        mode="edit"
        initialStep={1}
        onSaved={() => userId && loadMyProfile(userId)}
      />
    </>
  );
}
