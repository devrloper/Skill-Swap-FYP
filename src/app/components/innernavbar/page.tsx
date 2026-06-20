"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Bell,
  ArrowRightLeft,
  CheckCircle2,
  Clock3,
  Coins,
  UserRound,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Modal from "@/app/Modals/profilemodal/page";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/app/lib/firebase";
import type { User } from "firebase/auth";
import Button from "@/app/ui/button";
import { showErrorToast } from "@/app/lib/authToast";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

type NotificationItem = {
  id: string;
  userId?: string;
  type?: string;
  title?: string;
  message?: string;
  fromUserId?: string;
  senderId?: string;
  receiverId?: string;
  fromUserName?: string | null;
  senderName?: string | null;
  offeredSkill?: string;
  requestedSkill?: string;
  connectRequestId?: string;
  requestId?: string;
  connectionId?: string;
  status?: string;
  read?: boolean;
  createdAt?: unknown;
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifLoading, setNotifLoading] = useState<boolean>(false);
  const [profilePhotoURL, setProfilePhotoURL] = useState<string>("");
  const [profileName, setProfileName] = useState<string>("");
  const [credits, setCredits] = useState<number>(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsDesktopRef = useRef<HTMLDivElement>(null);
  const notificationsMobileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setIsEnrolled(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        const data = snap.exists() ? snap.data() : null;
        const interviewStatus = String(
          data?.interviewStatus || data?.interview?.result || "",
        ).toLowerCase();
        const failedInterview = interviewStatus === "fail";
        const enrolled =
          !failedInterview &&
          (Boolean(data?.enrolled) ||
            Boolean(data?.profileCompleted) ||
            interviewStatus === "pass" ||
            Boolean(data?.interviewScore) ||
            (Array.isArray(data?.completedSteps) && data.completedSteps.includes(4)));
        if (!cancelled) setIsEnrolled(enrolled);
      } catch (err) {
        console.error("Failed to check enrollment:", err);
        if (!cancelled) setIsEnrolled(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user?.uid) {
      setProfilePhotoURL("");
      setProfileName("");
      setCredits(0);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        const data = snap.exists() ? snap.data() : null;
        if (cancelled) return;

        setProfilePhotoURL(
          typeof data?.photoURL === "string" && !data.photoURL.startsWith("blob:")
            ? data.photoURL
            : "",
        );
        setProfileName(
          (data?.fullName || data?.name || user.displayName || "") as string,
        );
      } catch (err) {
        console.error("Failed to load profile avatar:", err);
        if (!cancelled) {
          setProfilePhotoURL("");
          setProfileName(user.displayName || "");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.displayName]);

  useEffect(() => {
    if (!user?.uid) {
      setCredits(0);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const profileRef = doc(db, "profiles", user.uid);
    let userCredits: number | null = null;
    let profileCredits: number | null = null;

    const syncCredits = () => {
      setCredits(userCredits ?? profileCredits ?? 0);
    };

    const unsubUser = onSnapshot(userRef, (snap) => {
      const value = snap.data()?.credits;
      userCredits = typeof value === "number" ? value : null;
      syncCredits();
    });

    const unsubProfile = onSnapshot(profileRef, (snap) => {
      const value = snap.data()?.credits;
      profileCredits = typeof value === "number" ? value : null;
      syncCredits();
    });

    return () => {
      unsubUser();
      unsubProfile();
    };
  }, [user]);
  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }
      if (
        notificationsDesktopRef.current &&
        !notificationsDesktopRef.current.contains(target) &&
        notificationsMobileRef.current &&
        !notificationsMobileRef.current.contains(target)
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, notificationsDesktopRef, notificationsMobileRef]);

  const fetchNotifications = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setNotifLoading(true);
    try {
      const res = await fetch(
        `/api/notifications/combined-v3?userId=${userId}&limit=10`,
        {
          cache: "no-store",
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load notifications");

      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadCount(Number(data?.unreadCount) || 0);
    } catch (err) {
      console.error("Notification fetch error:", err);
      showErrorToast("Notifications could not be loaded", "Please refresh and try again.");
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    (async () => {
      try {
        const token = await user.getIdToken();
        await fetch("/api/credits/sync", {
          method: "POST",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Credit sync failed:", err);
      }
    })();

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markNotificationRead = async (notificationId: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    if (notificationId.startsWith("connect:")) return;

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, userId }),
      });
      await fetchNotifications();
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const respondToConnectRequest = async (
    fromUserId: string,
    action: "accept" | "reject",
    notificationId?: string,
  ) => {
    const toUserId = auth.currentUser?.uid;
    if (!toUserId) return;

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/connect-requests/respond", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ fromUserId, toUserId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to respond");

      if (notificationId && !notificationId.startsWith("connect:")) {
        await markNotificationRead(notificationId);
      }
      await fetchNotifications();
    } catch (err) {
      console.error("Respond error:", err);
      showErrorToast(
        action === "accept" ? "Request could not be accepted" : "Request could not be rejected",
        err instanceof Error ? err.message : "Failed to respond.",
      );
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("Logout cookie clear failed:", err);
    }
    await signOut(auth);
    router.push("/signin");
  };

  const navLinkClass =
    "relative text-gray-700 hover:text-purple-600 transition font-medium after:absolute after:left-1/2 after:-bottom-1 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-purple-600 after:to-pink-500 after:transition-all after:duration-300 hover:after:w-full hover:after:left-0";
  const creditsBadge = (
    <Link
      href="/pricing"
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-bold transition sm:gap-1.5 sm:px-3 ${
        credits > 0
          ? "border-purple-100 bg-purple-50 text-purple-700 hover:bg-purple-100"
          : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
      }`}
      title={credits > 0 ? "Available credits" : "No credits left. Buy paid credits."}
    >
      <Coins className="h-4 w-4 shrink-0" />
      <span>{credits}</span>
      <span className="hidden sm:inline">Credits</span>
    </Link>
  );

  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-white/70 backdrop-blur-md z-50 shadow-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4 md:px-8 lg:px-10">
          {/* Logo */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-base font-bold text-white sm:h-10 sm:w-10 sm:text-lg">
              S
            </div>
            <span className="truncate text-base font-semibold text-gray-800 sm:text-xl">
              Skill Swap
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link href="/home" className={navLinkClass}>
              Home
            </Link>
            <Link href="/about" className={navLinkClass}>
              About
            </Link>

            <Link href="/matching" className={navLinkClass}>
              Matching
            </Link>
            <Link href="/chating" className={navLinkClass}>
              Chating
            </Link>
            <Link href="/chatbot" className={navLinkClass}>
              AI Chat Bot
            </Link>

            <Link href="/contact" className={navLinkClass}>
              Contact
            </Link>
            <Link href="/dashboard" className={navLinkClass}>
              Dashboard
            </Link>
            {!isEnrolled && (
              <button
                onClick={() => setOpen(true)}
                className="ml-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-full font-semibold shadow-md hover:brightness-105 transition cursor-pointer"
              >
                Enroll Now
              </button>
            )}
          </div>

          {/* Desktop Right Section */}
          <div className="hidden lg:flex items-center gap-4">
            {creditsBadge}
            {/* Notifications */}
            <div className="relative" ref={notificationsDesktopRef}>
              <button
                type="button"
                className="relative mt-2" 
                onClick={async () => {
                  const next = !notificationsOpen;
                  setNotificationsOpen(next);
                  if (next) await fetchNotifications();
                }}
              >
                <Bell className="w-6 h-6 text-gray-700 hover:text-purple-600 transition cursor-pointer" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full ring-2 ring-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white shadow-xl rounded-2xl border border-gray-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-semibold text-gray-800">Notifications</p>
                    <button
                      type="button"
                      className="text-xs text-purple-600 hover:underline"
                      onClick={fetchNotifications}
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {notifLoading && (
                      <div className="p-4 text-sm text-gray-500">Loading…</div>
                    )}

                    {!notifLoading && notifications.length === 0 && (
                      <div className="p-4 text-sm text-gray-500">
                        No notifications yet.
                      </div>
                    )}

                    {!notifLoading &&
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-gray-100 ${
                            n.read ? "bg-white" : "bg-purple-50"
                          }`}
                        >
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => {
                              if (!n.read) markNotificationRead(n.id);
                            }}
                          >
                            <p className="text-sm font-semibold text-gray-800">
                              {n.title || "Notification"}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {n.message || ""}
                            </p>
                          </button>

                          {(n.type === "connect_request" || n.type === "skill_request") && n.fromUserId && (
                            <div className="mt-3 rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-3 shadow-sm">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-[10px] font-semibold text-purple-700">
                                      <ArrowRightLeft size={11} />
                                      Connect request
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
                                      <Clock3 size={11} />
                                      Pending
                                    </span>
                                  </div>
                                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                                    {n.fromUserName || n.fromUserId || "A user"} wants to swap {n.offeredSkill || "a skill"} for {n.requestedSkill || "another skill"}.
                                  </p>
                                </div>
                                <Link
                                  href={`/profile/${n.fromUserId}`}
                                  className="inline-flex shrink-0 items-center gap-1 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-gray-800 border border-gray-200 hover:bg-gray-50 transition"
                                >
                                  <UserRound size={13} />
                                  Profile
                                </Link>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center gap-1 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                                  onClick={() =>
                                    respondToConnectRequest(
                                      n.fromUserId as string,
                                      "accept",
                                      n.id,
                                    )
                                  }
                                >
                                  <CheckCircle2 size={13} />
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center gap-1 rounded-2xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition"
                                  onClick={() =>
                                    respondToConnectRequest(
                                      n.fromUserId as string,
                                      "reject",
                                      n.id,
                                    )
                                  }
                                >
                                  <XCircle size={13} />
                                  Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar & Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-300 focus:outline-none"
              >
                {profilePhotoURL || user?.photoURL ? (
                  <img
                    src={profilePhotoURL || user?.photoURL || ""}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-semibold uppercase">
                    {profileName?.charAt(0) || user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                  </div>
                )}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white shadow-xl rounded-lg border border-gray-200 z-50 animate-fade-in">
                  <div className="flex flex-col items-center gap-2 p-4 border-b border-gray-100">
                    {profilePhotoURL || user?.photoURL ? (
                      // Show user image if available
                      <img
                        src={profilePhotoURL || user?.photoURL || ""}
                        alt="User"
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      // Fallback: show initials if no image
                      <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-lg uppercase">
                        {profileName?.charAt(0) || user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                      </div>
                    )}
                    <p className="font-semibold text-gray-800 text-center truncate">
                      {profileName || user?.displayName || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate text-center">
                      {user?.email}
                    </p>
                  </div>

                  <Button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-gray-700"
                  >
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right Section */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:hidden">
            {creditsBadge}
            <div className="relative" ref={notificationsMobileRef}>
              <button
                type="button"
                className="relative"
                onClick={async () => {
                  const next = !notificationsOpen;
                  setNotificationsOpen(next);
                  if (next) await fetchNotifications();
                }}
              >
                <Bell className="h-5 w-5 cursor-pointer text-gray-700 sm:h-6 sm:w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full ring-2 ring-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="fixed left-3 right-3 top-16 z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-semibold text-gray-800">Notifications</p>
                    <button
                      type="button"
                      className="text-xs text-purple-600 hover:underline"
                      onClick={fetchNotifications}
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {notifLoading && (
                      <div className="p-4 text-sm text-gray-500">Loading...</div>
                    )}

                    {!notifLoading && notifications.length === 0 && (
                      <div className="p-4 text-sm text-gray-500">
                        No notifications yet.
                      </div>
                    )}

                    {!notifLoading &&
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-gray-100 ${
                            n.read ? "bg-white" : "bg-purple-50"
                          }`}
                        >
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => {
                              if (!n.read) markNotificationRead(n.id);
                            }}
                          >
                            <p className="text-sm font-semibold text-gray-800">
                              {n.title || "Notification"}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {n.message || ""}
                            </p>
                          </button>

                          {(n.type === "connect_request" || n.type === "skill_request") && n.fromUserId && (
                            <div className="mt-3 rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-3 shadow-sm">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-[10px] font-semibold text-purple-700">
                                      <ArrowRightLeft size={11} />
                                      Connect request
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
                                      <Clock3 size={11} />
                                      Pending
                                    </span>
                                  </div>
                                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                                    {n.fromUserName || n.fromUserId || "A user"} wants to swap {n.offeredSkill || "a skill"} for {n.requestedSkill || "another skill"}.
                                  </p>
                                </div>
                                <Link
                                  href={`/profile/${n.fromUserId}`}
                                  className="inline-flex shrink-0 items-center gap-1 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-gray-800 border border-gray-200 hover:bg-gray-50 transition"
                                >
                                  <UserRound size={13} />
                                  Profile
                                </Link>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center gap-1 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                                  onClick={() =>
                                    respondToConnectRequest(
                                      n.fromUserId as string,
                                      "accept",
                                      n.id,
                                    )
                                  }
                                >
                                  <CheckCircle2 size={13} />
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center gap-1 rounded-2xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition"
                                  onClick={() =>
                                    respondToConnectRequest(
                                      n.fromUserId as string,
                                      "reject",
                                      n.id,
                                    )
                                  }
                                >
                                  <XCircle size={13} />
                                  Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div className="relative h-8 w-8 shrink-0 sm:h-9 sm:w-9">
              {profilePhotoURL || user?.photoURL ? (
                //  Google Sign-in Image
                <img
                  src={profilePhotoURL || user?.photoURL || ""}
                  alt="User"
                  className="h-8 w-8 rounded-full border border-gray-300 object-cover sm:h-9 sm:w-9"
                />
              ) : (
                // ✅ Email Signup → First Letter
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold uppercase text-white sm:h-9 sm:w-9 sm:text-base">
                  {profileName?.charAt(0) || user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                </div>
              )}

              {/* Online Status */}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />

              {/* Dropdown */}
              {profileOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-[min(12rem,calc(100vw-1.5rem))] rounded-lg border border-gray-200 bg-white shadow-xl"
                  onMouseLeave={() => setProfileOpen(false)}
                >
                  <div className="flex flex-col items-center gap-2 p-4 border-b border-gray-100">
                    {profilePhotoURL || user?.photoURL ? (
                      <img
                        src={profilePhotoURL || user?.photoURL || ""}
                        alt="User"
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-lg uppercase">
                        {profileName?.charAt(0) || user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                      </div>
                    )}
                    <p className="font-semibold text-gray-800 text-center truncate">
                      {profileName || user?.displayName || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate text-center">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-gray-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-700 hover:bg-purple-50 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="flex max-h-[calc(100dvh-4rem)] flex-col items-center space-y-4 overflow-y-auto border-t border-gray-200 bg-white/90 px-6 pt-6 pb-10 backdrop-blur-md lg:hidden">
            {/* Mobile / Tablet Links */}
            <Link
              href="/"
              className="block text-gray-700 hover:text-purple-600 font-medium text-lg sm:text-xl md:text-2xl"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="block text-gray-700 hover:text-purple-600 font-medium text-lg sm:text-xl md:text-2xl"
            >
              About
            </Link>
            <Link
              href="/matching"
              className="block text-gray-700 hover:text-purple-600 font-medium text-lg sm:text-xl md:text-2xl"
            >
              Matching
            </Link>
            <Link
              href="/chating"
              className="block text-gray-700 hover:text-purple-600 font-medium text-lg sm:text-xl md:text-2xl"
            >
              Chating
            </Link>

            <Link
              href="/chatbot"
              className="block text-gray-700 hover:text-purple-600 font-medium text-lg sm:text-xl md:text-2xl"
            >
              AI Chat Bot
            </Link>

            <Link
              href="/contact"
              className="block text-gray-700 hover:text-purple-600 font-medium text-lg sm:text-xl md:text-2xl"
            >
              Contact
            </Link>
            <Link
              href="/dashboard"
              className="block text-gray-700 hover:text-purple-600 font-medium text-lg sm:text-xl md:text-2xl"
            >
              Dashboard
            </Link>

            {/* Enroll Now Button for mobile/tablet */}
            {!isEnrolled && (
              <button
                onClick={() => setOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-full font-semibold shadow-md hover:brightness-105 transition cursor-pointer text-sm sm:text-base md:text-lg mt-4"
              >
                Enroll Now
              </button>
            )}
          </div>
        )}
      </header>
      <Modal open={open} setOpen={setOpen} mode="enroll" />
    </>
  );
}
