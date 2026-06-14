"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Home,
  Users,
  MessageSquare,
  FileText,
  Video,
  Bell,
  Settings,
  Search,
  Phone,
  VideoIcon,
  MoreHorizontal,
  Send,
  Paperclip,
  Smile,
  MapPin,
  ChevronLeft,
  Loader2,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Star,
} from "lucide-react";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import Navbar from "@/app/components/innernavbar/page";
import ChipLoader from "@/app/components/loader/page";
import { ProtectedRoute } from "@/app/ui/ProtectedRoute";
import { useAuth } from "@/app/contexts/AuthContext";
import { db } from "@/app/lib/firebase";
import { showAuthToast, showErrorToast } from "@/app/lib/authToast";
import { pairId, toMillis } from "@/app/lib/skill-request-utils";
import { motion, AnimatePresence } from "framer-motion";

type FirestoreRecord = Record<string, unknown>;

type ChatUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  location: string;
  avatar: string;
  lastMsg: string;
  lastMessageAt: number;
  unreadCount: number;
  online: boolean;
};

type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  createdAt: number;
  type?: "text" | "schedule";
  schedule?: {
    topic: string;
    dateTime: number;
    duration: number;
    notes?: string;
    status: "pending" | "accepted" | "completed" | "cancelled";
    proposedBy: string;
    acceptedBy?: string;
    joinUrl?: string;
    startUrl?: string;
  };
};

type ScheduleForm = {
  topic: string;
  dateTime: string;
  duration: string;
  notes: string;
};

type FeedbackTarget = {
  sessionId: string;
  topic: string;
};

function getStringValue(source: FirestoreRecord, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function buildAvatarUrl(user: FirestoreRecord, name: string, id: string) {
  const raw = getStringValue(user, ["photoURL", "avatar", "image", "photo"]);
  if (raw && !raw.startsWith("blob:")) {
    return raw.startsWith("data:")
      ? raw
      : `${raw}${user.photoUpdatedAt ? `?v=${user.photoUpdatedAt}` : ""}`;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User",
  )}&background=4B164C&color=fff&size=160&bold=true&length=2&rounded=true&u=${id}`;
}

function formatMessageTime(value: number) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatLastSeen(value: number) {
  if (!value) return "";
  const diff = Date.now() - value;
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(value);
}

function formatScheduleDateTime(value: number) {
  if (!value) return "Time not selected";
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function buildDefaultScheduleTime() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

async function readApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => ({}));
  }

  const text = await response.text().catch(() => "");
  return {
    error:
      text && !text.startsWith("<!DOCTYPE")
        ? text
        : response.ok
          ? ""
          : "Server returned an unexpected response.",
  };
}

function mergeUserRecords(
  usersMap: Map<string, FirestoreRecord>,
  profilesMap: Map<string, FirestoreRecord>,
  currentUserId: string,
  lastMessages: Map<string, { text: string; createdAt: number }>,
  unreadCounts: Map<string, number>,
) {
  const ids = new Set([...usersMap.keys(), ...profilesMap.keys()]);

  return Array.from(ids)
    .filter((id) => id && id !== currentUserId)
    .map((id) => {
      const merged = {
        ...(usersMap.get(id) || {}),
        ...(profilesMap.get(id) || {}),
      };
      const name = getStringValue(
        merged,
        ["fullName", "name", "displayName"],
        "Skill Swap User",
      );
      const lastMessage = lastMessages.get(id);

      return {
        id,
        name,
        email: getStringValue(merged, ["email"]),
        role: getStringValue(merged, ["role", "experience"], "Skill Swap Member"),
        location: getStringValue(merged, ["location", "city"], "Location not added"),
        avatar: buildAvatarUrl(merged, name, id),
        lastMsg: lastMessage?.text || "Start a conversation",
        lastMessageAt: lastMessage?.createdAt || toMillis(merged.createdAt),
        unreadCount: unreadCounts.get(id) || 0,
        online: false,
      };
    })
    .sort((a, b) => {
      const timeDiff = (b.lastMessageAt || 0) - (a.lastMessageAt || 0);
      return timeDiff || a.name.localeCompare(b.name);
    });
}

function WorkableChatContent() {
  const { user, userData, loading } = useAuth();
  const [usersMap, setUsersMap] = useState<Map<string, FirestoreRecord>>(new Map());
  const [profilesMap] = useState<Map<string, FirestoreRecord>>(new Map());
  const [lastMessages, setLastMessages] = useState<
    Map<string, { text: string; createdAt: number }>
  >(new Map());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [activeUserId, setActiveUserId] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [acceptingScheduleId, setAcceptingScheduleId] = useState("");
  const [updatingSessionId, setUpdatingSessionId] = useState("");
  const [feedbackTarget, setFeedbackTarget] = useState<FeedbackTarget | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
    topic: "",
    dateTime: buildDefaultScheduleTime(),
    duration: "30",
    notes: "",
  });
  const [chatError, setChatError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const contacts = useMemo(
    () =>
      mergeUserRecords(
        usersMap,
        profilesMap,
        user?.uid || "",
        lastMessages,
        unreadCounts,
      ),
    [usersMap, profilesMap, user?.uid, lastMessages, unreadCounts],
  );

  const filteredContacts = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return contacts;
    return contacts.filter((contact) =>
      [contact.name, contact.email, contact.role, contact.location]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [contacts, searchTerm]);

  const activeUser =
    contacts.find((contact) => contact.id === activeUserId) || filteredContacts[0] || null;

  const currentUserName =
    userData?.name || user?.displayName || user?.email?.split("@")[0] || "You";
  const currentUserAvatar = buildAvatarUrl(
    {
      photoURL: user?.photoURL || userData?.avatar || "",
      email: user?.email || userData?.email || "",
    },
    currentUserName,
    user?.uid || "me",
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    let isMounted = true;

    const loadAcceptedChatUsers = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(
          `/api/chat/users?userId=${encodeURIComponent(user.uid)}`,
          {
            cache: "no-store",
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await readApiResponse(response);
        if (!isMounted) return;
        const directoryUsers = Array.isArray(data?.users) ? data.users : [];
        setUsersMap(
          new Map(
            directoryUsers
              .filter((item: FirestoreRecord) => typeof item.id === "string")
              .map((item: FirestoreRecord) => [String(item.id), item]),
          ),
        );
    } catch (error) {
      console.error("Failed to load chat users:", error);
      showErrorToast("Chat users could not be loaded", "Please refresh and try again.");
      if (isMounted) setUsersMap(new Map());
    }
    };

    loadAcceptedChatUsers();

    let messageUnsubs: Array<() => void> = [];
    const unsubChats = onSnapshot(
      collection(db, "users", user.uid, "chats"),
      (snapshot) => {
        const next = new Map<string, { text: string; createdAt: number }>();
        const seenPeerIds = new Set<string>();

        messageUnsubs.forEach((unsubscribe) => unsubscribe());
        messageUnsubs = [];

        snapshot.docs.forEach((item) => {
          const data = item.data() as FirestoreRecord;
          const peerId = getStringValue(data, ["peerId"]);
          if (!peerId) return;
          seenPeerIds.add(peerId);
          next.set(peerId, {
            text: getStringValue(data, ["lastMessage"], "Start a conversation"),
            createdAt: toMillis(data.updatedAt) || toMillis(data.createdAt),
          });

          const chatId = getStringValue(data, ["chatId"], item.id);
          const unreadQuery = query(
            collection(db, "chatRooms", chatId, "messages"),
            orderBy("createdAt", "asc"),
          );
          messageUnsubs.push(
            onSnapshot(unreadQuery, (messagesSnapshot) => {
              const unreadCount = messagesSnapshot.docs.filter((messageDoc) => {
                const message = messageDoc.data() as FirestoreRecord;
                const readBy = Array.isArray(message.readBy)
                  ? message.readBy.map(String)
                  : [];
                return (
                  getStringValue(message, ["senderId"]) !== user.uid &&
                  !readBy.includes(user.uid)
                );
              }).length;

              setUnreadCounts((current) => {
                const updated = new Map(current);
                if (unreadCount > 0) {
                  updated.set(peerId, unreadCount);
                } else {
                  updated.delete(peerId);
                }
                return updated;
              });
            }),
          );
        });
        setLastMessages(next);
        setUnreadCounts((current) => {
          const updated = new Map(current);
          Array.from(updated.keys()).forEach((peerId) => {
            if (!seenPeerIds.has(peerId)) updated.delete(peerId);
          });
          return updated;
        });
      },
    );

    return () => {
      isMounted = false;
      unsubChats();
      messageUnsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [user]);

  useEffect(() => {
    if (!activeUserId && filteredContacts.length) {
      setActiveUserId(filteredContacts[0].id);
    }
  }, [activeUserId, filteredContacts]);

  useEffect(() => {
    if (!user?.uid || !activeUser?.id) {
      setMessages([]);
      return;
    }

    setChatError("");
    const chatId = pairId(user.uid, activeUser.id);
    const messagesQuery = query(
      collection(db, "chatRooms", chatId, "messages"),
      orderBy("createdAt", "asc"),
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(
          snapshot.docs.map((item) => {
            const data = item.data() as FirestoreRecord;
            return {
              id: item.id,
              text: getStringValue(data, ["text", "content"]),
              senderId: getStringValue(data, ["senderId"]),
              receiverId: getStringValue(data, ["receiverId"]),
              createdAt: toMillis(data.createdAt),
              type: data.type === "schedule" ? "schedule" : "text",
              schedule:
                data.schedule && typeof data.schedule === "object"
                  ? {
                      topic: getStringValue(data.schedule as FirestoreRecord, ["topic"], "Skill Swap Meeting"),
                      dateTime: toMillis((data.schedule as FirestoreRecord).dateTime),
                      duration:
                        typeof (data.schedule as FirestoreRecord).duration === "number"
                          ? ((data.schedule as FirestoreRecord).duration as number)
                          : 30,
                      notes: getStringValue(data.schedule as FirestoreRecord, ["notes"]),
                      status: ["accepted", "completed", "cancelled"].includes(
                        String((data.schedule as FirestoreRecord).status),
                      )
                        ? (String((data.schedule as FirestoreRecord).status) as
                            | "accepted"
                            | "completed"
                            | "cancelled")
                        : "pending",
                      proposedBy: getStringValue(data.schedule as FirestoreRecord, ["proposedBy"]),
                      acceptedBy: getStringValue(data.schedule as FirestoreRecord, ["acceptedBy"]),
                      joinUrl: getStringValue(data.schedule as FirestoreRecord, ["joinUrl"]),
                      startUrl: getStringValue(data.schedule as FirestoreRecord, ["startUrl"]),
                    }
                  : undefined,
            };
          }),
        );
      },
      (error) => {
      console.error("Chat listener failed:", error);
      const message = "Messages could not be loaded. Please check Firestore permissions or indexes.";
      showErrorToast("Messages could not be loaded", message);
      setChatError(message);
      },
    );

    return unsubscribe;
  }, [activeUser?.id, user?.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const markChatRead = async (peerId: string) => {
    if (!user?.uid) return;

    const chatId = pairId(user.uid, peerId);
    const messagesQuery = query(
      collection(db, "chatRooms", chatId, "messages"),
      orderBy("createdAt", "asc"),
    );

    try {
      const snapshot = await getDocs(messagesQuery);
      const unreadDocs = snapshot.docs.filter((item) => {
        const data = item.data() as FirestoreRecord;
        const readBy = Array.isArray(data.readBy) ? data.readBy.map(String) : [];
        return (
          getStringValue(data, ["senderId"]) !== user.uid &&
          !readBy.includes(user.uid)
        );
      });

      if (!unreadDocs.length) return;

      await Promise.all(
        unreadDocs.map((item) =>
          updateDoc(item.ref, {
            readBy: arrayUnion(user.uid),
          }),
        ),
      );
      setUnreadCounts((current) => {
        const updated = new Map(current);
        updated.delete(peerId);
        return updated;
      });
    } catch (error) {
      console.error("Failed to mark chat as read:", error);
    }
  };

  const ensureChatRoom = async (peer: ChatUser, text: string) => {
    if (!user?.uid) return "";
    const chatId = pairId(user.uid, peer.id);
    const chatRoomRef = doc(db, "chatRooms", chatId);
    const now = serverTimestamp();
    const currentUserTitle = currentUserName;

    try {
      await updateDoc(chatRoomRef, {
        updatedAt: now,
        lastMessage: text,
        lastSenderId: user.uid,
      });
    } catch {
      await setDoc(
        chatRoomRef,
        {
          id: chatId,
          participants: chatId.split("__"),
          chatEnabled: true,
          updatedAt: now,
          createdAt: now,
          lastMessage: text,
          lastSenderId: user.uid,
        },
        { merge: true },
      );
    }

    await Promise.all([
      setDoc(
        doc(db, "users", user.uid, "chats", chatId),
        {
          chatId,
          peerId: peer.id,
          title: peer.name,
          chatEnabled: true,
          lastMessage: text,
          updatedAt: now,
          createdAt: now,
        },
        { merge: true },
      ),
      setDoc(
        doc(db, "users", peer.id, "chats", chatId),
        {
          chatId,
          peerId: user.uid,
          title: currentUserTitle,
          chatEnabled: true,
          lastMessage: text,
          updatedAt: now,
          createdAt: now,
        },
        { merge: true },
      ),
    ]);

    return chatId;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !activeUser || !user?.uid || isSending) return;

    setIsSending(true);
    setChatError("");

    try {
      const chatId = await ensureChatRoom(activeUser, text);
      await addDoc(collection(db, "chatRooms", chatId, "messages"), {
        text,
        senderId: user.uid,
        receiverId: activeUser.id,
        readBy: [user.uid],
        type: "text",
        createdAt: Timestamp.now(),
      });
      setInputText("");
    } catch (error) {
      console.error("Failed to send message:", error);
      const message = "Message could not be sent. Please check Firestore write permissions.";
      showErrorToast("Message could not be sent", message);
      setChatError(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || !user?.uid || isScheduling) return;

    const topic = scheduleForm.topic.trim() || "Skill Swap Meeting";
    const dateTime = new Date(scheduleForm.dateTime).getTime();
    const duration = Number(scheduleForm.duration) || 30;

    if (!dateTime || Number.isNaN(dateTime)) {
      setChatError("Please select a valid meeting date and time.");
      return;
    }

    const previewText = `Meeting proposed: ${topic} - ${formatScheduleDateTime(dateTime)}`;
    setIsScheduling(true);
    setChatError("");

    try {
      const chatId = await ensureChatRoom(activeUser, previewText);
      await addDoc(collection(db, "chatRooms", chatId, "messages"), {
        text: previewText,
        senderId: user.uid,
        receiverId: activeUser.id,
        readBy: [user.uid],
        type: "schedule",
        schedule: {
          topic,
          dateTime: Timestamp.fromMillis(dateTime),
          duration,
          notes: scheduleForm.notes.trim(),
          status: "pending",
          proposedBy: user.uid,
        },
        createdAt: Timestamp.now(),
      });
      setScheduleForm({
        topic: "",
        dateTime: buildDefaultScheduleTime(),
        duration: "30",
        notes: "",
      });
      setIsScheduleOpen(false);
    } catch (error) {
      console.error("Failed to create schedule:", error);
      const message = "Schedule could not be sent. Please check Firestore write permissions.";
      showErrorToast("Schedule could not be sent", message);
      setChatError(message);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleAcceptSchedule = async (message: ChatMessage) => {
    if (!activeUser || !user?.uid || !message.schedule || acceptingScheduleId) return;
    const chatId = pairId(user.uid, activeUser.id);
    setAcceptingScheduleId(message.id);
    setChatError("");

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          peerId: activeUser.id,
          chatId,
          scheduleMessageId: message.id,
        }),
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || "Schedule could not be accepted.");
      }

      showAuthToast(
        "Meeting accepted",
        data?.deductedCredits
          ? "1 credit has been deducted from the requester."
          : "This meeting was already scheduled.",
      );

      await ensureChatRoom(
        activeUser,
        `Meeting confirmed: ${message.schedule.topic} - ${formatScheduleDateTime(
          message.schedule.dateTime,
        )}`,
      );
    } catch (error) {
      console.error("Failed to accept schedule:", error);
      const message = error instanceof Error ? error.message : "Schedule could not be accepted.";
      const displayMessage =
        message.toLowerCase().includes("1 credit")
          ? `${message} Please buy paid credits from the credits badge in the navbar.`
          : message;
      showErrorToast("Schedule could not be accepted", displayMessage);
      setChatError(displayMessage);
    } finally {
      setAcceptingScheduleId("");
    }
  };

  const handleUpdateSessionStatus = async (
    message: ChatMessage,
    status: "completed" | "cancelled",
  ) => {
    if (!activeUser || !user?.uid || !message.schedule || updatingSessionId) return;

    const chatId = pairId(user.uid, activeUser.id);
    const sessionId = `${chatId}_${message.id}`;
    setUpdatingSessionId(sessionId);
    setChatError("");

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/sessions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ sessionId, status }),
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || "Session could not be updated.");
      }

      await ensureChatRoom(
        activeUser,
        status === "completed"
          ? `Meeting completed: ${message.schedule.topic}`
          : `Meeting cancelled: ${message.schedule.topic}`,
      );

      if (status === "completed") {
        setFeedbackRating(5);
        setFeedbackComment("");
        setFeedbackTarget({
          sessionId,
          topic: message.schedule.topic,
        });
      }
    } catch (error) {
      console.error("Failed to update session:", error);
      const message = error instanceof Error ? error.message : "Session could not be updated.";
      showErrorToast("Session could not be updated", message);
      setChatError(message);
    } finally {
      setUpdatingSessionId("");
    }
  };

  const handleSubmitFeedback = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!feedbackTarget || !user?.uid || isSubmittingFeedback) return;

    setIsSubmittingFeedback(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/session-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          sessionId: feedbackTarget.sessionId,
          rating: feedbackRating,
          comment: feedbackComment,
        }),
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || "Feedback could not be submitted.");
      }

      showAuthToast("Feedback submitted", "Thank you for sharing your experience.");
      setFeedbackTarget(null);
      setFeedbackComment("");
      setFeedbackRating(5);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Feedback could not be submitted.";
      showErrorToast("Feedback could not be submitted", message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E5D9F2]">
        <Loader2 className="w-8 h-8 animate-spin text-[#4B164C]" />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isInitialLoading && (
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
      </AnimatePresence>

      <div className="flex h-screen w-full bg-[#E5D9F2] p-2 lg:p-4 gap-2 lg:gap-4 overflow-hidden font-sans text-slate-800 mt-16">
        <Navbar />

        <aside className="hidden lg:flex w-20 bg-[#4B164C] rounded-[32px] flex-col items-center py-8 relative shadow-2xl shrink-0">
          <div className="flex flex-col gap-8 text-white/50">
            <Home className="w-6 h-6 cursor-pointer hover:text-white" />
            <Users className="w-6 h-6 cursor-pointer hover:text-white" />
            <div className="bg-[#F3F4F6] p-4 rounded-l-[24px] -mr-4 text-[#4B164C] z-10 relative">
              <MessageSquare className="w-6 h-6" />
            </div>
            <FileText className="w-6 h-6 cursor-pointer hover:text-white" />
            <Video className="w-6 h-6 cursor-pointer hover:text-white" />
            <Bell className="w-6 h-6 cursor-pointer hover:text-white" />
            <Settings className="w-6 h-6 cursor-pointer hover:text-white" />
          </div>
          <div className="mt-auto flex flex-col items-center gap-2">
            <img
              src={currentUserAvatar}
              className="w-10 h-10 rounded-full border-2 border-orange-400 p-0.5 object-cover"
              alt={currentUserName}
            />
            <span className="text-[10px] text-white/70 text-center leading-tight max-w-14 truncate">
              {currentUserName}
            </span>
          </div>
        </aside>

        <section
          className={`${mobileView === "list" ? "flex" : "hidden"} md:flex w-full md:w-72 lg:w-80 flex-col gap-4 shrink-0`}
        >
          <div className="bg-white rounded-[28px] p-6 flex-1 shadow-sm flex flex-col overflow-hidden">
            <h2 className="text-xl font-bold mb-4">Chat</h2>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full bg-[#F8F9FB] rounded-xl py-2.5 pl-10 text-sm focus:outline-none border border-slate-100 placeholder:text-slate-400"
                placeholder="Search users..."
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => {
                    setActiveUserId(contact.id);
                    setMobileView("chat");
                    markChatRead(contact.id);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer ${
                    contact.unreadCount > 0
                      ? "bg-purple-50 ring-1 ring-purple-200 shadow-sm"
                      : activeUser?.id === contact.id
                        ? "bg-slate-50 shadow-inner"
                        : "hover:bg-slate-50"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={contact.avatar}
                      className="w-11 h-11 rounded-full border-2 border-white shadow-sm object-cover"
                      alt={contact.name}
                    />
                    {contact.unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4B164C] px-1.5 text-[10px] font-black text-white ring-2 ring-white">
                        {contact.unreadCount > 9 ? "9+" : contact.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-center gap-2">
                      <p
                        className={`font-bold text-sm truncate ${
                          contact.unreadCount > 0
                            ? "text-[#4B164C]"
                            : activeUser?.id === contact.id
                              ? "text-[#4B164C]"
                              : "text-slate-700"
                        }`}
                      >
                        {contact.name}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatLastSeen(contact.lastMessageAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p
                        className={`min-w-0 truncate text-xs ${
                          contact.unreadCount > 0
                            ? "font-semibold text-slate-700"
                            : "text-slate-400"
                        }`}
                      >
                        {contact.lastMsg}
                      </p>
                      {contact.unreadCount > 0 && (
                        <span className="shrink-0 rounded-full bg-[#4B164C] px-2 py-0.5 text-[10px] font-black text-white">
                          {contact.unreadCount} unseen{" "}
                          {contact.unreadCount === 1 ? "msg" : "msgs"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {!filteredContacts.length && (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No accepted chat users yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <main
          className={`${mobileView === "chat" ? "flex" : "hidden"} md:flex flex-1 bg-white rounded-[28px] shadow-sm flex-col overflow-hidden`}
        >
          {activeUser ? (
            <>
              <header className="px-4 lg:px-8 py-5 border-b border-slate-50 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileView("list")}
                    className="md:hidden p-1 text-slate-400"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <img
                    src={activeUser.avatar}
                    className="w-10 h-10 rounded-full object-cover"
                    alt={activeUser.name}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm lg:text-base truncate">
                      {activeUser.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {activeUser.email || activeUser.role}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 lg:gap-6 text-slate-400 items-center">
                  <Phone className="w-5 h-5 cursor-pointer hover:text-[#4B164C]" />
                  <VideoIcon className="w-5 h-5 cursor-pointer hover:text-[#4B164C]" />
                  <MoreHorizontal className="w-5 h-5 cursor-pointer" />
                </div>
              </header>

              <div className="flex-1 p-4 lg:p-8 overflow-y-auto space-y-6 bg-[#FBFCFE]">
                {chatError && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {chatError}
                  </div>
                )}

                {!messages.length && !chatError && (
                  <div className="h-full min-h-80 flex items-center justify-center text-center">
                    <div>
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#4B164C]/10 text-[#4B164C]">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        Start chatting with {activeUser.name}
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((message) => {
                  const isMine = message.senderId === user?.uid;
                  const isSchedule = message.type === "schedule" && message.schedule;
                  const canAcceptSchedule =
                    isSchedule &&
                    message.schedule?.status === "pending" &&
                    message.senderId !== user?.uid;
                  const canCloseSchedule =
                    isSchedule && message.schedule?.status === "accepted";
                  const isZoomHost =
                    isSchedule &&
                    message.schedule?.status === "accepted" &&
                    message.schedule.acceptedBy === user?.uid;
                  const zoomUrl =
                    isSchedule && message.schedule?.status === "accepted"
                      ? isZoomHost
                        ? message.schedule.startUrl || message.schedule.joinUrl
                        : message.schedule.joinUrl
                      : "";
                  const scheduleSessionId =
                    isSchedule && activeUser && user?.uid
                      ? `${pairId(user.uid, activeUser.id)}_${message.id}`
                      : "";
                  const isUpdatingSession = scheduleSessionId === updatingSessionId;
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 max-w-[85%] lg:max-w-[75%] ${
                        isMine ? "ml-auto flex-row-reverse" : ""
                      }`}
                    >
                      {!isMine && (
                        <img
                          src={activeUser.avatar}
                          className="w-8 h-8 rounded-full self-end mb-1 object-cover"
                          alt={activeUser.name}
                        />
                      )}
                      <div className={`flex flex-col ${isMine ? "items-end" : ""}`}>
                        <p className="text-[10px] text-slate-400 mb-1 px-2">
                          {isMine ? "You" : activeUser.name.split(" ")[0]}{" "}
                          {formatMessageTime(message.createdAt)}
                        </p>
                        {isSchedule ? (
                          <div
                            className={`w-[min(100%,26rem)] rounded-[24px] p-4 text-sm shadow-sm ${
                              isMine
                                ? "bg-[#4B164C] text-white rounded-tr-none shadow-purple-100"
                                : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                  isMine ? "bg-white/15" : "bg-[#4B164C]/10 text-[#4B164C]"
                                }`}
                              >
                                <CalendarDays className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold leading-tight">
                                  {message.schedule?.topic}
                                </p>
                                <p className={`mt-1 text-xs ${isMine ? "text-white/75" : "text-slate-500"}`}>
                                  {formatScheduleDateTime(message.schedule?.dateTime || 0)}
                                </p>
                                <p className={`mt-1 text-xs ${isMine ? "text-white/75" : "text-slate-500"}`}>
                                  {message.schedule?.duration} minutes
                                </p>
                                {message.schedule?.notes && (
                                  <p className={`mt-3 text-xs leading-relaxed ${isMine ? "text-white/85" : "text-slate-600"}`}>
                                    {message.schedule.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 space-y-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  ["accepted", "completed"].includes(message.schedule?.status || "")
                                    ? isMine
                                      ? "bg-emerald-400/20 text-emerald-50"
                                      : "bg-emerald-50 text-emerald-700"
                                    : message.schedule?.status === "cancelled"
                                      ? isMine
                                        ? "bg-red-400/20 text-red-50"
                                        : "bg-red-50 text-red-700"
                                    : isMine
                                      ? "bg-white/15 text-white"
                                      : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {["accepted", "completed"].includes(message.schedule?.status || "") && (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                {message.schedule?.status === "cancelled" && (
                                  <XCircle className="h-3 w-3" />
                                )}
                                {message.schedule?.status === "completed"
                                  ? "Completed"
                                  : message.schedule?.status === "cancelled"
                                    ? "Cancelled"
                                  : message.schedule?.status === "accepted"
                                      ? "Accepted"
                                      : "Pending"}
                              </span>

                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                              {canAcceptSchedule && (
                                <button
                                  type="button"
                                  onClick={() => handleAcceptSchedule(message)}
                                  disabled={acceptingScheduleId === message.id}
                                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-[#4B164C] px-3 py-2 text-xs font-semibold leading-none text-white transition hover:bg-[#3d103e] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {acceptingScheduleId === message.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3" />
                                  )}
                                  Accept
                                </button>
                              )}

                              {canCloseSchedule && (
                                zoomUrl ? (
                                  <a
                                    href={zoomUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold leading-none text-white transition hover:bg-blue-700"
                                  >
                                    <Video className="h-3 w-3" />
                                    {isZoomHost ? "Start Zoom" : "Join Zoom"}
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      showErrorToast(
                                        "Zoom link is not available",
                                        "This accepted schedule does not have a saved Zoom link. Send a new schedule and accept it again.",
                                      )
                                    }
                                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-slate-500 px-3 py-2 text-xs font-semibold leading-none text-white transition hover:bg-slate-600"
                                  >
                                    <Video className="h-3 w-3" />
                                    {isZoomHost ? "Start Zoom" : "Join Zoom"}
                                  </button>
                                )
                              )}

                              {canCloseSchedule && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSessionStatus(message, "completed")}
                                    disabled={isUpdatingSession}
                                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold leading-none text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isUpdatingSession ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3 w-3" />
                                    )}
                                    Complete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSessionStatus(message, "cancelled")}
                                    disabled={isUpdatingSession}
                                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-red-600 px-3 py-2 text-xs font-semibold leading-none text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Cancel
                                  </button>
                                </>
                              )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`p-4 rounded-[24px] text-sm shadow-sm break-words ${
                              isMine
                                ? "bg-[#4B164C] text-white rounded-tr-none shadow-purple-100"
                                : "bg-white border border-slate-100 text-slate-600 rounded-tl-none"
                            }`}
                          >
                            {message.text}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <footer className="p-4 lg:p-6">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-2 pl-4 rounded-[24px] focus-within:bg-white focus-within:border-purple-200 transition-all"
                >
                  <Smile className="hidden sm:block w-5 h-5 text-slate-400" />
                  <input
                    className="flex-1 bg-transparent text-sm focus:outline-none min-w-0"
                    placeholder={`Message ${activeUser.name}...`}
                    value={inputText}
                    onChange={(event) => setInputText(event.target.value)}
                  />
                  <div className="flex items-center gap-2 pr-1">
                    <Paperclip className="hidden sm:block w-5 h-5 text-slate-400 rotate-45" />
                    <button
                      type="button"
                      onClick={() => setIsScheduleOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#4B164C]/15 bg-white px-3 py-2 text-xs font-semibold text-[#4B164C] transition hover:bg-[#4B164C]/5"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Schedule
                    </button>
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isSending}
                      className="bg-[#4B164C] p-3 rounded-full text-white shadow-lg hover:scale-105 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </form>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-[#FBFCFE] p-8 text-center">
              <div>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#4B164C]/10 text-[#4B164C]">
                  <Users className="h-6 w-6" />
                </div>
                <p className="font-semibold text-slate-800">No chat users available</p>
                <p className="mt-1 text-sm text-slate-500">
                  Users will appear here after a skill swap request is accepted.
                </p>
              </div>
            </div>
          )}
        </main>

        <AnimatePresence>
          {isScheduleOpen && activeUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] flex h-[100dvh] items-start justify-center overflow-hidden bg-black/40 px-3 py-3 sm:items-center sm:px-4 sm:py-6"
            >
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 w-full max-w-md flex-col overflow-hidden rounded-[22px] bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-[28px] sm:p-6"
              >
                <div className="mb-5 flex shrink-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-slate-800">Schedule Meeting</p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Send a meeting proposal to {activeUser.name}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsScheduleOpen(false)}
                    className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200 sm:text-sm"
                  >
                    Close
                  </button>
                </div>

                <form
                  onSubmit={handleCreateSchedule}
                  className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]"
                >
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Topic
                    </span>
                    <input
                      value={scheduleForm.topic}
                      onChange={(event) =>
                        setScheduleForm((prev) => ({ ...prev, topic: event.target.value }))
                      }
                      className="w-full min-w-0 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#4B164C]"
                      placeholder="Skill swap session"
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Date & time
                      </span>
                      <input
                        type="datetime-local"
                        value={scheduleForm.dateTime}
                        onChange={(event) =>
                          setScheduleForm((prev) => ({ ...prev, dateTime: event.target.value }))
                        }
                        className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#4B164C] sm:px-4"
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Duration
                      </span>
                      <select
                        value={scheduleForm.duration}
                        onChange={(event) =>
                          setScheduleForm((prev) => ({ ...prev, duration: event.target.value }))
                        }
                        className="w-full min-w-0 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#4B164C]"
                      >
                        <option value="15">15 min</option>
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">60 min</option>
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Notes
                    </span>
                    <textarea
                      value={scheduleForm.notes}
                      onChange={(event) =>
                        setScheduleForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      className="min-h-24 w-full min-w-0 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#4B164C]"
                      placeholder="Add agenda or meeting details"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isScheduling}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4B164C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3d103e] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isScheduling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarDays className="h-4 w-4" />
                    )}
                    Send Schedule
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {feedbackTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4"
            >
              <motion.div
                initial={{ y: 24, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 24, opacity: 0, scale: 0.96 }}
                className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-slate-800">Rate this meeting</p>
                    <p className="mt-1 text-sm text-slate-500">{feedbackTarget.topic}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedbackTarget(null)}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-200"
                  >
                    Skip
                  </button>
                </div>

                <form onSubmit={handleSubmitFeedback} className="space-y-5">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Rating
                    </p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFeedbackRating(value)}
                          className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                            value <= feedbackRating
                              ? "border-amber-300 bg-amber-50 text-amber-500"
                              : "border-slate-200 bg-white text-slate-300 hover:bg-slate-50"
                          }`}
                          aria-label={`Rate ${value} out of 5`}
                        >
                          <Star className="h-5 w-5" fill={value <= feedbackRating ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Feedback
                    </span>
                    <textarea
                      value={feedbackComment}
                      onChange={(event) => setFeedbackComment(event.target.value)}
                      className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#4B164C]"
                      placeholder="Share what went well or what could be improved"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4B164C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3d103e] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmittingFeedback ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                    Submit Feedback
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeUser && (
          <aside className="hidden xl:flex w-72 lg:w-70 bg-white rounded-[28px] p-8 shadow-sm flex-col items-center shrink-0">
            <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-[6px] border-[#F3F4F6] overflow-hidden mb-4 shadow-inner">
              <img
                src={activeUser.avatar}
                className="w-full h-full object-cover"
                alt={activeUser.name}
              />
            </div>

            <div className="text-center w-full">
              <h3 className="text-xl font-bold text-slate-800">{activeUser.name}</h3>
              <p className="text-sm text-slate-400">{activeUser.role}</p>
              <div className="flex items-center justify-center gap-1 text-[11px] text-red-400 mt-2 font-semibold">
                <MapPin className="w-3 h-3" /> {activeUser.location}
              </div>
            </div>

            <div className="w-full mt-8 space-y-4 pt-8 border-t border-slate-100 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">E-mail:</span>
                <span className="font-bold truncate">{activeUser.email || "Not added"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">User ID:</span>
                <span className="font-bold truncate">{activeUser.id}</span>
              </div>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}

export default function WorkableChat() {
  return (
    <ProtectedRoute>
      <WorkableChatContent />
    </ProtectedRoute>
  );
}
