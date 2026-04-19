"use client";

import React, { useState, useRef, useEffect } from "react";
import NavBar from "@/app/components/innernavbar/page";
import Button from "@/app/ui/button";
import {
  Send,
  Mic,
  MicOff,
  Trash2,
  Pencil,
  Plus,
  Search,
  Menu,
  Bot,
  User,
  X,
} from "lucide-react";
import { ChatMessage } from "@/app/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import ChipLoader from "@/app/components/loader/page";

type Chat = {
  id: string;
  title: string;
  messages: ChatMessage[];
};

export default function ChatbotPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const messages = activeChat?.messages || [];

  const skillSwapQuestions = [
    "What is SkillSwap?",
    "How to exchange skills?",
    "AI Matching work?",
    "Is it free?",
  ];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  const startNewChat = () => {
    const id = Date.now().toString();
    setChats((prev) => [
      {
        id,
        title: "New Conversation",
        messages: [
          {
            id: "welcome",
            role: "assistant",
            content:
              "Hi! I'm your SkillSwap AI assistant. How can I help you today?",
            timestamp: Date.now(),
          },
        ],
      },
      ...prev,
    ]);
    setActiveChatId(id);
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  useEffect(() => {
    if (chats.length === 0) startNewChat();
  }, []);

  const handleSendMessage = async (text?: string) => {
    const content = text || inputMessage;
    if (!content.trim() || !activeChatId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: content,
      timestamp: Date.now(),
    };

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChatId) return chat;
        const isFirst =
          chat.messages.filter((m) => m.role === "user").length === 0;
        return {
          ...chat,
          title:
            isFirst && chat.title === "New Conversation"
              ? content.slice(0, 30)
              : chat.title,
          messages: [...chat.messages, userMessage],
        };
      }),
    );

    setInputMessage("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content }),
      });
      const data = await res.json();
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: data.text,
                    timestamp: Date.now(),
                  },
                ],
              }
            : chat,
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = () => {
    const Speech =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Speech) return alert("Not supported");
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    const rec = new Speech();
    rec.onstart = () => setIsRecording(true);
    rec.onresult = (e: any) => setInputMessage(e.results[0][0].transcript);
    rec.onend = () => setIsRecording(false);
    rec.start();
    recognitionRef.current = rec;
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

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
      <div className="flex flex-col h-screen bg-[#f3f4f6] overflow-hidden text-slate-900">
        <NavBar />

        <div className="flex flex-1 pt-18 overflow-hidden relative">
          {/* SIDEBAR - */}
          {showSidebar && (
            <div
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
            />
          )}
          <aside
            className={`
          fixed md:relative inset-y-0 left-0 z-50 w-72 bg-gradient-to-br from-[#fbc2eb] to-purple-600  flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-200
          ${showSidebar ? "translate-x-0" : "-translate-x-full md:-ml-72"}
        `}
          >
            <div className="p-4 flex flex-col h-full pt-20 md:pt-16 lg:pt-4 relative">
              {" "}
              <button
                onClick={() => setShowSidebar(false)}
                className="absolute top-4 right-4 lg:hidden text-white z-50"
              >
                <X size={24} />
              </button>
              <button
                onClick={startNewChat}
                className="w-full py-3 mb-6 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl flex items-center justify-center gap-2 font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Plus size={18} /> New Chat
              </button>
              <div className="relative mb-4">
                <Search
                  className="absolute left-3 top-2.5 text-slate-400"
                  size={16}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 ring-purple-100 text-sm transition-all"
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {chats
                  .filter((c) =>
                    c.title.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setActiveChatId(chat.id)}
                      className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                        chat.id === activeChatId
                          ? "bg-purple-100 border border-purple-200 text-purple-800"
                          : "hover:bg-slate-200/50 text-slate-600"
                      }`}
                    >
                      <span className="truncate text-sm font-medium pr-2">
                        {chat.title}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil
                          size={14}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChatId(chat.id);
                            setEditTitle(chat.title);
                            setIsEditModalOpen(true);
                          }}
                          className="hover:text-purple-600 p-0.5"
                        />
                        <Trash2
                          size={14}
                          onClick={(e) => {
                            e.stopPropagation();
                            setChats((prev) =>
                              prev.filter((x) => x.id !== chat.id),
                            );
                          }}
                          className="hover:text-red-500 p-0.5"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </aside>

          {/* MAIN CHAT - Soft Background */}
          <main className="flex-1 flex flex-col bg-[#f3f4f6] relative min-w-0">
            <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                >
                  <Menu size={20} />
                </button>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-800 text-sm truncate max-w-[150px] md:max-w-[300px]">
                    {activeChat?.title || "New Chat"}
                  </h2>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      AI Active
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-inner">
                <Bot size={18} />
              </div>
            </header>

            {/* Messages Area */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
            >
              <div className="max-w-3xl mx-auto w-full ">
                {messages.length === 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-16 text-center mb-10 md:mb-14"
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mx-auto mb-4 text-purple-600">
                      <Bot size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                      SkillSwap AI
                    </h1>
                    <p className="text-slate-500 text-sm">
                      Ask me anything about swapping skills or your account.
                    </p>
                  </motion.div>
                )}

                <AnimatePresence mode="popLayout">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex mb-6 gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`mt-1 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm ${
                            msg.role === "user"
                              ? "bg-purple-600 text-white"
                              : "bg-white border border-slate-200 text-slate-600"
                          }`}
                        >
                          {msg.role === "user" ? (
                            <User size={16} />
                          ) : (
                            <Bot size={16} />
                          )}
                        </div>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                            msg.role === "user"
                              ? "bg-purple-600 text-white rounded-tr-none"
                              : "bg-purple-50 border border-purple-100 text-slate-800 rounded-tl-none"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <div className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <Bot size={16} />
                    </div>
                    <div className="bg-purple-50 border border-purple-100 px-4 py-3 rounded-2xl flex gap-1">
                      <span className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <footer className="p-4 md:p-6 bg-white/70 backdrop-blur-md border-t border-slate-200 shrink-0">
              <div className="max-w-3xl mx-auto w-full">
                {messages.length === 1 && (
                  <div className="flex flex-wrap gap-2 mb-4 justify-center">
                    {skillSwapQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(q)}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all bg-white shadow-sm"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 focus-within:ring-2 ring-purple-200 transition-all shadow-md">
                  <button
                    onClick={handleVoiceInput}
                    className={`p-2.5 rounded-xl transition-all ${isRecording ? "bg-red-500 text-white animate-pulse shadow-md" : "text-slate-400 hover:bg-slate-100"}`}
                  >
                    {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  <input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                    placeholder="Search chats..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-pink-100 rounded-lg outline-none focus:outline-none focus:ring-2 focus:ring-purple-100 text-sm transition-all"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim()}
                    className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all disabled:opacity-30 active:scale-90"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </footer>
          </main>
        </div>

        {/* RENAME MODAL */}
        <AnimatePresence>
          {isEditModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setIsEditModalOpen(false)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-6 w-full max-w-sm z-10 shadow-2xl border border-slate-100"
              >
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Rename Chat
                </h2>
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-purple-100 outline-none mb-6 font-medium"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-2.5 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setChats((prev) =>
                        prev.map((c) =>
                          c.id === editingChatId
                            ? { ...c, title: editTitle }
                            : c,
                        ),
                      );
                      setIsEditModalOpen(false);
                    }}
                    className="flex-1 py-2.5 font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-sm shadow-md cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
