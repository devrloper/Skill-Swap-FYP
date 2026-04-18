"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Smile, Paperclip, Send, X, Mic } from "lucide-react";

export default function Chatbot() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hello! How can I help you today? 😊" },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[999]">
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-3 sm:mb-4 w-[95vw] sm:w-[380px] max-w-[420px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col shadow-purple-200/50 "
            style={{ height: "75vh", maxHeight: "520px" }}
          >
            {/* Header */}
            <div className="bg-purple-600 px-4 py-4 sm:p-6 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none text-xl flex flex-wrap gap-3 p-2">
                <span>⬡</span> <span>□</span> <span>⬩</span> <span>○</span>
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-[10px] sm:text-xs font-medium mb-2 sm:mb-3 border border-white/20">
                  <MessageSquare size={12} fill="white" /> Skill Swap AI
                </div>
                <h3 className="font-bold text-base sm:text-lg">
                  Got Questions?
                </h3>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 p-3 sm:p-5 bg-white overflow-y-auto space-y-3 sm:space-y-4"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] text-white ${
                      msg.role === "user" ? "bg-purple-600" : "bg-black"
                    }`}
                  >
                    {msg.role === "user" ? "U" : "KS"}
                  </div>

                  <div
                    className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-[12px] sm:text-[14px] max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white rounded-tr-none"
                        : "bg-[#f0f2f7] text-gray-800 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 ml-8 sm:ml-10">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 sm:p-5 bg-white border-t border-gray-50">
              <div className="bg-[#f4f7f9] rounded-2xl p-3 sm:p-4 border border-gray-100">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your message..."
                  rows={1}
                  className="bg-transparent w-full text-sm outline-none text-gray-700 resize-none"
                />

                <div className="flex items-center justify-between mt-2 sm:mt-3 text-gray-400 flex-wrap gap-2">
                  <div className="flex gap-3 items-center">
                    <Smile
                      size={16}
                      className="cursor-pointer hover:text-purple-600"
                    />
                    <Paperclip
                      size={16}
                      className="cursor-pointer hover:text-purple-600"
                    />
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="disabled:opacity-30 active:scale-90"
                  >
                    <Send size={18} className="text-[#6e2cf2]" />
                  </button>
                </div>
              </div>

              <div className="text-[9px] text-center mt-2 text-gray-400 opacity-60">
                Powered by <span className="font-bold">Gemini AI</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="
      w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
      rounded-full bg-purple-600 flex items-center justify-center 
      shadow-2xl text-white border-4 border-white/20
    "
      >
        {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </div>
  );
}
