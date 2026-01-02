"use client";

import React, { useState, useRef, useEffect } from "react";
import NavBar from "@/app/components/navbar/page";
import Footer from "@/app/components/footer/page";
import { Button } from "@/app/ui/button";
import { Send, X } from "lucide-react";
import { ChatMessage } from "@/app/lib/types";
import { Mic, MicOff } from "lucide-react";

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

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const messages = activeChat?.messages || [];

  /* ✅ CHAT AREA AUTO SCROLL ONLY */
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
      prev.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, userMessage] }
          : chat
      )
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

          {/*  SIDEBAR */}
          <div
            className={`
              fixed md:static z-40
              top-0 left-0 h-full
              w-72 p-5 flex flex-col
              bg-gradient-to-b from-purple-500 via-pink-500 to-indigo-500 backdrop-blur-md text-white
              transform transition-transform duration-300
              ${showSidebar ? "translate-x-0" : "-translate-x-full"}
              md:translate-x-0
            `}
          >
            {/* CLOSE BUTTON */}
            <div className="flex justify-between items-center mb-4 md:hidden">
              <h2 className="text-lg font-semibold">Chats</h2>
              <button onClick={() => setShowSidebar(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <Button
              onClick={startNewChat}
              className="mb-4 bg-white/30 hover:bg-white/40 text-white"
            >
              + New Chat
            </Button>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="mb-4 px-3 py-2 rounded-lg bg-white/30 placeholder-white/70 focus:outline-none"
            />

            <div className="flex-1 space-y-2 overflow-y-auto">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    setShowSidebar(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    chat.id === activeChatId
                      ? "bg-white/40"
                      : "hover:bg-white/20"
                  }`}
                >
                  {chat.title}
                </button>
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
                  className="px-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white shrink-0"
                >
                  <Send />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
