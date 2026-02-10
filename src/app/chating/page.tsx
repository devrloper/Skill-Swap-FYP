"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/contexts/AuthContext";
import { Send, Search, Phone, Video, MoreVertical } from "lucide-react";
import Navbar from "@/app/components/innernavbar/page";
type ChatDoc = {
  participants: string[];
  lastMessage?: string;
  updatedAt?: Timestamp;
};

type MessageDoc = {
  senderId: string;
  text: string;
  createdAt?: Timestamp;
};

type UserDoc = {
  name?: string;
  email?: string;
  photoURL?: string;
  status?: "online" | "offline" | "away";
  lastSeen?: Timestamp;
};

type ChatItem = {
  id: string;
  otherUserId: string;
  lastMessage?: string;
  updatedAt?: Timestamp;
};

const formatTime = (value?: Timestamp) => {
  if (!value) return "";
  const date = value.toDate();
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatLastSeen = (value?: Timestamp) => {
  if (!value) return "offline";
  const date = value.toDate();
  return `last seen ${date.toLocaleString()}`;
};

const getChatIdForUsers = (a: string, b: string) => {
  return [a, b].sort().join("_");
};

export default function ChatPage() {
  const { user, userData, loading } = useAuth();
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [userInfo, setUserInfo] = useState<Record<string, UserDoc>>({});
  const [newChatUserId, setNewChatUserId] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const activeOtherUser = activeChat ? userInfo[activeChat.otherUserId] : null;

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chats;
    const term = search.toLowerCase();
    return chats.filter((c) => {
      const info = userInfo[c.otherUserId];
      const name = info?.name || info?.email || c.otherUserId;
      return name.toLowerCase().includes(term);
    });
  }, [chats, search, userInfo]);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);

    const setOnline = () =>
      setDoc(
        userRef,
        { status: "online", lastSeen: serverTimestamp() },
        { merge: true }
      );

    const setOffline = () =>
      setDoc(
        userRef,
        { status: "offline", lastSeen: serverTimestamp() },
        { merge: true }
      );

    setOnline();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setOnline();
      } else {
        setOffline();
      }
    };

    window.addEventListener("beforeunload", setOffline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("beforeunload", setOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
      setOffline();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as ChatDoc;
        const otherUserId =
          data.participants.find((id) => id !== user.uid) || user.uid;
        return {
          id: docSnap.id,
          otherUserId,
          lastMessage: data.lastMessage,
          updatedAt: data.updatedAt,
        };
      });
      setChats(items);
      if (!activeChatId && items.length > 0) {
        setActiveChatId(items[0].id);
      }
      if (activeChatId && items.every((c) => c.id !== activeChatId)) {
        setActiveChatId(items[0]?.id || "");
      }
    });

    return () => unsubscribe();
  }, [user, activeChatId]);

  useEffect(() => {
    if (chats.length === 0) return;
    const unsubscribers: Array<() => void> = [];
    const uniqueIds = Array.from(
      new Set(chats.map((c) => c.otherUserId))
    );

    uniqueIds.forEach((id) => {
      const userRef = doc(db, "users", id);
      const unsub = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setUserInfo((prev) => ({
            ...prev,
            [id]: snap.data() as UserDoc,
          }));
        }
      });
      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach((u) => u());
  }, [chats]);

  useEffect(() => {
    if (!activeChatId) return;
    const q = query(
      collection(db, "chats", activeChatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((docSnap) => docSnap.data() as MessageDoc);
      setMessages(items);
      requestAnimationFrame(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    });
    return () => unsubscribe();
  }, [activeChatId]);

  const createOrOpenChat = async () => {
    if (!user) return;
    const targetId = newChatUserId.trim();
    if (!targetId || targetId === user.uid) return;

    const chatId = getChatIdForUsers(user.uid, targetId);
    await setDoc(
      doc(db, "chats", chatId),
      {
        participants: [user.uid, targetId],
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setActiveChatId(chatId);
    setNewChatUserId("");
  };

  const sendMessage = async () => {
    if (!user || !activeChatId || !message.trim()) return;
    const text = message.trim();
    setMessage("");
    setSending(true);
    try {
      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        senderId: user.uid,
        text,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "chats", activeChatId),
        {
          lastMessage: text,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0b141a] flex items-center justify-center text-white/80">
        Loading chat...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full bg-[#0b141a] flex items-center justify-center text-white/80">
        Please sign in to use chat.
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[radial-gradient(circle_at_top_left,_#1a2b34_0%,_#0b141a_45%,_#081117_100%)] flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-[32%] lg:w-[26%] bg-[linear-gradient(180deg,_#0f1c23,_#0b141a)] border-r border-white/10 flex-col mt-19">
          {/* Sidebar Header */}
          <div className="p-5 flex items-center justify-between bg-[#121f26] border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[linear-gradient(135deg,_#0ea5a4,_#00d2a1)] flex items-center justify-center text-white font-semibold shadow-lg shadow-emerald-500/20">
                {(userData?.name || user.displayName || user.email || "U")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <h3 className="text-white font-semibold tracking-wide">
                  Conversations
                </h3>
                <p className="text-[11px] text-white/60 truncate max-w-[180px]">
                  {userData?.name || user.displayName || user.email}
                </p>
              </div>
            </div>
            <MoreVertical className="text-white/70" />
          </div>

          {/* Search */}
          <div className="p-4 space-y-3">
            <div className="flex items-center bg-[#13222a] rounded-2xl px-3 ring-1 ring-white/5 focus-within:ring-emerald-400/40">
              <Search className="text-white/50 w-4" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations"
                className="bg-transparent outline-none text-sm text-white px-2 py-2.5 w-full placeholder:text-white/40"
              />
            </div>
            <div className="flex gap-2">
              <input
                value={newChatUserId}
                onChange={(e) => setNewChatUserId(e.target.value)}
                placeholder="Enter user id to start"
                className="flex-1 bg-[#13222a] rounded-2xl px-3 py-2.5 text-xs text-white outline-none ring-1 ring-white/5 placeholder:text-white/40"
              />
              <button
                onClick={createOrOpenChat}
                className="px-4 py-2.5 text-xs rounded-2xl bg-[#00a884] text-white hover:bg-[#02c39a] shadow-lg shadow-emerald-500/20"
              >
                Start
              </button>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {filteredChats.length === 0 ? (
              <div className="px-4 py-6 text-sm text-white/50">
                No chats yet. Start by entering a user id.
              </div>
            ) : (
              filteredChats.map((chat) => {
                const info = userInfo[chat.otherUserId];
                const name = info?.name || info?.email || chat.otherUserId;
                const status = info?.status || "offline";
                return (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition ${
                      activeChatId === chat.id ? "bg-white/5" : ""
                    }`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-[#16232b] flex items-center justify-center text-white font-semibold ring-1 ring-white/5">
                        {name.trim().charAt(0).toUpperCase()}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0f1c23] ${
                          status === "online" ? "bg-green-400" : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{name}</p>
                      <p className="text-white/50 text-sm truncate">
                        {chat.lastMessage || "Say hello to start conversation"}
                      </p>
                    </div>
                    <span className="text-[11px] text-white/40">
                      {formatTime(chat.updatedAt)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col mt-19">
          {/* Chat Header */}
          <div className="h-16 bg-[#121f26] flex items-center justify-between px-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-[#16232b] flex items-center justify-center text-white font-semibold ring-1 ring-white/5">
                  {(activeOtherUser?.name ||
                    activeOtherUser?.email ||
                    activeChat?.otherUserId ||
                    "U")
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#121f26] ${
                    activeOtherUser?.status === "online"
                      ? "bg-green-400"
                      : "bg-gray-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-white font-semibold">
                  {activeOtherUser?.name ||
                    activeOtherUser?.email ||
                    activeChat?.otherUserId ||
                    "Select a chat"}
                </p>
                <p className="text-xs text-white/50 flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] tracking-wide ${
                      activeOtherUser?.status === "online"
                        ? "bg-emerald-500/15 text-emerald-200"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {activeOtherUser?.status === "online"
                      ? "online"
                      : "offline"}
                  </span>
                  <span className="hidden sm:inline">
                    {activeOtherUser?.status === "online"
                      ? "available now"
                      : formatLastSeen(activeOtherUser?.lastSeen)}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <button className="p-2 rounded-xl hover:bg-white/5 transition">
                <Video />
              </button>
              <button className="p-2 rounded-xl hover:bg-white/5 transition">
                <Phone />
              </button>
              <button className="p-2 rounded-xl hover:bg-white/5 transition">
                <MoreVertical />
              </button>
            </div>
          </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 bg-[radial-gradient(circle_at_top,_rgba(0,210,161,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(72,99,200,0.12),_transparent_55%)]">
          {activeChatId ? (
            messages.length === 0 ? (
              <div className="text-white/60 text-sm">
                No messages yet. Send the first message.
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={`${msg.senderId}-${idx}`}
                  className={`flex ${
                    msg.senderId === user.uid
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-md ${
                      msg.senderId === user.uid
                        ? "bg-[#0b6b57] text-white rounded-br-none shadow-emerald-500/10"
                        : "bg-[#16232b] text-white rounded-bl-none ring-1 ring-white/5"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className="text-[10px] text-white/50 text-right mt-1">
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="text-white/60 text-sm">
              Select a chat from the left panel.
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Input */}
        <div className="p-5 bg-[#121f26] flex items-center gap-3 border-t border-white/5">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={
              activeChatId ? "Type a message" : "Select a chat to start"
            }
            disabled={!activeChatId || sending}
            className="flex-1 bg-[#0f1c23] rounded-2xl px-4 py-3 text-white outline-none disabled:opacity-60 ring-1 ring-white/10 focus:ring-emerald-400/40 placeholder:text-white/40"
          />
          <button
            onClick={sendMessage}
            disabled={!activeChatId || sending}
            className="bg-[#00a884] hover:bg-[#02c39a] px-4 py-3 rounded-2xl text-white disabled:opacity-60 shadow-lg shadow-emerald-500/20"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
