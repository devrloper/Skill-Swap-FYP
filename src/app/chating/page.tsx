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
} from "lucide-react";
import {
  addDoc,
  collection,
  doc,
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
  online: boolean;
};

type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  createdAt: number;
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

function mergeUserRecords(
  usersMap: Map<string, FirestoreRecord>,
  profilesMap: Map<string, FirestoreRecord>,
  currentUserId: string,
  lastMessages: Map<string, { text: string; createdAt: number }>,
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
  const [activeUserId, setActiveUserId] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const contacts = useMemo(
    () => mergeUserRecords(usersMap, profilesMap, user?.uid || "", lastMessages),
    [usersMap, profilesMap, user?.uid, lastMessages],
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
        const data = await response.json();
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
        if (isMounted) setUsersMap(new Map());
      }
    };

    loadAcceptedChatUsers();

    const unsubChats = onSnapshot(
      collection(db, "users", user.uid, "chats"),
      (snapshot) => {
        const next = new Map<string, { text: string; createdAt: number }>();
        snapshot.docs.forEach((item) => {
          const data = item.data() as FirestoreRecord;
          const peerId = getStringValue(data, ["peerId"]);
          if (!peerId) return;
          next.set(peerId, {
            text: getStringValue(data, ["lastMessage"], "Start a conversation"),
            createdAt: toMillis(data.updatedAt) || toMillis(data.createdAt),
          });
        });
        setLastMessages(next);
      },
    );

    return () => {
      isMounted = false;
      unsubChats();
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
            };
          }),
        );
      },
      (error) => {
        console.error("Chat listener failed:", error);
        setChatError("Messages load nahi ho pa rahe. Firestore permissions/index check karein.");
      },
    );

    return unsubscribe;
  }, [activeUser?.id, user?.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      setChatError("Message send nahi hua. Firestore write permissions check karein.");
    } finally {
      setIsSending(false);
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
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer ${
                    activeUser?.id === contact.id
                      ? "bg-slate-50 shadow-inner"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <img
                    src={contact.avatar}
                    className="w-11 h-11 rounded-full border-2 border-white shadow-sm object-cover"
                    alt={contact.name}
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-center gap-2">
                      <p
                        className={`font-bold text-sm truncate ${
                          activeUser?.id === contact.id ? "text-[#4B164C]" : "text-slate-700"
                        }`}
                      >
                        {contact.name}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatLastSeen(contact.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{contact.lastMsg}</p>
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
                        <div
                          className={`p-4 rounded-[24px] text-sm shadow-sm break-words ${
                            isMine
                              ? "bg-[#4B164C] text-white rounded-tr-none shadow-purple-100"
                              : "bg-white border border-slate-100 text-slate-600 rounded-tl-none"
                          }`}
                        >
                          {message.text}
                        </div>
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
                  Jab skill swap request accept hogi, woh user yahan show hoga.
                </p>
              </div>
            </div>
          )}
        </main>

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
