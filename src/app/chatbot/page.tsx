"use client";

import React, { useState, useRef, useEffect } from "react";
import NavBar from "@/app/components/navbar/page";
import Footer from "@/app/components/footer/page";
import  Button  from "@/app/ui/button";
import { Send, X } from "lucide-react";
import { ChatMessage } from "@/app/lib/types";
import { Mic, MicOff } from "lucide-react";
import { Trash2, Pencil } from "lucide-react";

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
  const [showSidebar, setShowSidebar] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const messages = activeChat?.messages || [];
  const skillSwapQuestions = [
    "What is SkillSwap and how does it work?",
    "How can I exchange skills on SkillSwap?",
    "How does AI matching work in SkillSwap?",
    "Is SkillSwap free for beginners?",
  ];

  /* CHAT AREA AUTO SCROLL ONLY */
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  /* ✅ START NEW CHAT */
  const startNewChat = () => {
    const id = Date.now().toString();
    setChats((prev) => [
      {
        id,
        title: "New Chat",
        messages: [
          {
            id: "welcome",
            role: "assistant",
            content: "Hi! I'm your SkillSwap AI assistant.",
            timestamp: Date.now(),
          },
        ],
      },
      ...prev,
    ]);
    setActiveChatId(id);
    setShowSidebar(false);
  };

  useEffect(() => {
    if (chats.length === 0) startNewChat();
    // eslint-disable-next-line
  }, []);

  /* ✅ SEND MESSAGE */
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeChatId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: Date.now(),
    };

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChatId) return chat;

        const isFirstUserMessage =
          chat.messages.filter((m) => m.role === "user").length === 0;

        return {
          ...chat,
          title:
            isFirstUserMessage && chat.title === "New Chat"
              ? generateChatTitle(userMessage.content)
              : chat.title,
          messages: [...chat.messages, userMessage],
        };
      })
    );

    setInputMessage("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage.content }),
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
                    id: Date.now().toString(),
                    role: "assistant",
                    content: data.text,
                    timestamp: Date.now(),
                  },
                ],
              }
            : chat
        )
      );
    } catch (err) {
      console.error("Error sending message:", err);
    }

    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /* ✅ VOICE RECORDING */
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    if (isRecording) {
      // Stop recording
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      handleSendMessage(); // automatically send after recording
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
  };
  const generateChatTitle = (text: string) => {
    return text.split(" ").slice(0, 4).join(" ") + "...";
  };
  const deleteChat = (id: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  };
  const editChatTitle = (id: string) => {
    const newTitle = prompt("Edit chat title");
    if (!newTitle) return;

    setChats((prev) =>
      prev.map((chat) => (chat.id === id ? { ...chat, title: newTitle } : chat))
    );
  };
  const openEditModal = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
    setIsEditModalOpen(true);
  };

  const saveEditedTitle = () => {
    if (!editTitle.trim() || !editingChatId) return;

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === editingChatId ? { ...chat, title: editTitle.trim() } : chat
      )
    );

    setIsEditModalOpen(false);
  };
  return (
    <div className="min-h-screen  flex flex-col bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300">
      <NavBar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 mt-16">
        <div className="h-[75vh] flex rounded-3xl overflow-hidden bg-white/40 backdrop-blur-2xl shadow-2xl relative">
          {/*  OVERLAY (CLICK TO CLOSE) */}
          {showSidebar && (
            <div
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/40 z-30 md:hidden"
            />
          )}

          {/* SIDEBAR */}
          <div className="w-72 p-5 bg-gradient-to-r from-purple-950 to-pink-950 text-white flex flex-col">
            <Button onClick={startNewChat} className="mb-4 bg-white/30">
              + New Chat
            </Button>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="mb-4 px-3 py-2 rounded bg-white/20"
            />

            <div className="flex-1 space-y-2 overflow-y-auto">
              {chats
                .filter((c) =>
                  c.title.toLowerCase().includes(search.toLowerCase())
                )
                .map((chat) => (
                  <div
                    key={chat.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer ${
                      chat.id === activeChatId
                        ? "bg-white/40"
                        : "hover:bg-white/20"
                    }`}
                    onClick={() => setActiveChatId(chat.id)}
                  >
                    <span className="truncate">{chat.title}</span>

                    <div className="flex gap-2">
                      <Pencil
                        size={16}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(chat);
                        }}
                        className="hover:text-purple-300"
                      />
                      <Trash2
                        size={16}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(chat.id);
                        }}
                        className="hover:text-red-400"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/*  CHAT AREA */}
          <div className="flex-1 flex flex-col w-full">
            {/* MOBILE HEADER */}
            <div className="md:hidden p-3 bg-white/60 border-b flex items-center">
              <button onClick={() => setShowSidebar(true)}>☰</button>
              <h2 className="ml-3 font-semibold">SkillSwap AI</h2>
            </div>

            {/* MESSAGES */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.length === 1 && (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      Welcome to SkillSwap AI
                    </h1>
                    <p className="text-gray-700">
                      Ask anything and get instant help
                    </p>
                  </div>
                </div>
              )}

              {messages.length > 1 &&
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-white shadow">
                      {msg.content}
                    </div>
                  </div>
                ))}
            </div>
            {/* SUGGESTED QUESTIONS (TEXT ONLY) */}
            {messages.length === 1 && (
              <div className="px-4 pb-3">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                  Suggested questions
                </p>

                <div className="flex flex-wrap gap-2">
                  {skillSwapQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInputMessage(q)}
                      className=" px-3 py-1.5 text-sm rounded-full bg-white/70 border border-gray-200 text-gray-800 hover:bg-purple-50hover:border-purple-300 hover:text-purple-700 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/*  INPUT (WITH VOICE RECORDING) */}
            <div className="p-3 bg-white/70">
              <div className="flex items-center gap-2">
                <input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message or use voice..."
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-white focus:outline-none"
                />

                <Button
                  onClick={handleVoiceInput}
                  className={`px-4 shrink-0 ${
                    isRecording
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  onClick={handleSendMessage}
                  
                >
                  <Send />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 🔹 EDIT TITLE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md z-10">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">Edit Chat Title</h2>
              <X onClick={() => setIsEditModalOpen(false)} />
            </div>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button
                onClick={saveEditedTitle}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
