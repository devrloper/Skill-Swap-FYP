"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NavBar from "@/app/components/innernavbar/page";
import ChipLoader from "@/app/components/loader/page";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, RotateCcw, Send, Sparkles, User } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

const welcomeMessage: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I am your SkillSwap AI assistant. Ask me about learning paths, skill swaps, mentors, credits, or certification.",
  timestamp: Date.now(),
};

const starterPrompts = [
  "How does SkillSwap work?",
  "How can I choose a skill to learn?",
  "How do I get certified?",
  "How do mentor sessions work?",
];

const historyKey = (user: FirebaseUser | null) =>
  `skillswap-ai-chat:${user?.uid || "guest"}`;

export default function ChatbotPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const userName = useMemo(() => {
    const displayName = user?.displayName?.trim();
    if (displayName) return displayName.split(" ")[0];
    return user?.email?.split("@")[0] || "there";
  }, [user]);

  useEffect(
    () =>
      onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthReady(true);
      }),
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    try {
      const saved = window.localStorage.getItem(historyKey(user));
      const parsed = saved ? (JSON.parse(saved) as Message[]) : null;
      setMessages(
        Array.isArray(parsed) && parsed.length
          ? parsed
          : [{ ...welcomeMessage, timestamp: Date.now() }],
      );
    } catch {
      setMessages([{ ...welcomeMessage, timestamp: Date.now() }]);
    }
  }, [authReady, user]);

  useEffect(() => {
    if (!authReady) return;
    window.localStorage.setItem(historyKey(user), JSON.stringify(messages));
  }, [authReady, messages, user]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  const resetChat = () => {
    const next = [{ ...welcomeMessage, timestamp: Date.now() }];
    setMessages(next);
    window.localStorage.setItem(historyKey(user), JSON.stringify(next));
  };

  const handleSendMessage = useCallback(
    async (text?: string) => {
      const content = (text || inputMessage).trim();
      if (!content || isTyping) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputMessage("");
      setIsTyping(true);

      try {
        const res = await fetch("/api/homechat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content }),
        });
        const data = (await res.json()) as { reply?: string };
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.reply || "I could not generate a reply right now.",
            timestamp: Date.now(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: "Something went wrong. Please try again.",
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [inputMessage, isTyping],
  );

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          >
            <div className="w-full max-w-md">
              <ChipLoader />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main
        className="min-h-screen bg-cover bg-center bg-no-repeat text-slate-950"
        style={{ backgroundImage: "url('/bgchatbot.jpg')" }}
      >
        <NavBar />
        <section className="relative overflow-hidden px-4 pb-6 pt-24 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-white/35 backdrop-blur-[1px]" />
          <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/50 bg-white shadow-[0_24px_80px_rgba(88,28,135,.20)]">
            <header className="border-b border-slate-100 bg-white/90 px-5 py-4 backdrop-blur md:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-700 text-white shadow-lg shadow-purple-200">
                    <Bot size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-bold text-slate-950">
                        SkillSwap AI
                      </h1>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Welcome back, {userName}. Your previous chat is shown
                      here.
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetChat}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-purple-200 hover:text-purple-700"
                >
                  <RotateCcw size={16} />
                  Clear chat
                </button>
              </div>
            </header>

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,.12),transparent_32%),linear-gradient(180deg,#ffffff,#f8f5ff)] px-4 py-6 md:px-8"
            >
              <div className="mx-auto flex max-w-3xl flex-col gap-5">
                {messages.length <= 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-purple-100 bg-white p-6 text-center shadow-sm"
                  >
                    <Sparkles className="mx-auto text-purple-600" size={30} />
                    <h2 className="mt-3 text-2xl font-bold">
                      What can I help you with?
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                      Ask one question and continue the same conversation here
                      whenever you return.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {starterPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => handleSendMessage(prompt)}
                          className="rounded-full border border-purple-100 bg-purple-50 px-4 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-700 hover:text-white"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                <AnimatePresence mode="popLayout">
                  {messages.map((message) => {
                    const isUser = message.role === "user";
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        {!isUser && (
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-purple-100 bg-white text-purple-700 shadow-sm">
                            <Bot size={17} />
                          </div>
                        )}
                        <div
                          className={`max-w-[82%] rounded-3xl px-5 py-3 text-sm leading-6 shadow-sm ${
                            isUser
                              ? "rounded-br-md bg-purple-700 text-white"
                              : "rounded-bl-md border border-slate-100 bg-white text-slate-800"
                          }`}
                        >
                          {message.content}
                        </div>
                        {isUser && (
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white shadow-sm">
                            <User size={17} />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-purple-100 bg-white text-purple-700 shadow-sm">
                      <Bot size={17} />
                    </div>
                    <div className="flex items-center gap-1 rounded-3xl rounded-bl-md border border-slate-100 bg-white px-5 py-4 shadow-sm">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-purple-300" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-purple-300 [animation-delay:0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-purple-300 [animation-delay:0.3s]" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <footer className="border-t border-slate-100 bg-white px-4 py-4 md:px-7">
              <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner focus-within:border-purple-300 focus-within:bg-white">
                <textarea
                  value={inputMessage}
                  onChange={(event) => setInputMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  rows={1}
                  placeholder="Write your message..."
                  className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                  onClick={() => void handleSendMessage()}
                  disabled={!inputMessage.trim() || isTyping}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-purple-700 text-white shadow-lg shadow-purple-100 transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={18} />
                </button>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </>
  );
}
