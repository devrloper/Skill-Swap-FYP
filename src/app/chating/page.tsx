"use client";
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import Navbar from "@/app/components/innernavbar/page";
import ChipLoader from "@/app/components/loader/page";
import { motion, AnimatePresence } from "framer-motion";
const CONTACTS = [
  {
    id: 1,
    name: "Sayali Sontakke",
    role: "Web Designer",
    loc: "Pune, India",
    lastMsg: "Lorem ipsum dolor sit amet...",
    time: "11m ago",
    avatar: "https://i.pravatar.cc/150?u=sayali",
    email: "sayali@gmail.com",
  },
  {
    id: 2,
    name: "Rohit Agarwal",
    role: "UI Developer",
    loc: "Mumbai, India",
    lastMsg: "The design is ready!",
    time: "3h ago",
    avatar: "https://i.pravatar.cc/150?u=rohit",
    email: "rohit@gmail.com",
  },
  {
    id: 3,
    name: "John Alex",
    role: "Product Manager",
    loc: "London, UK",
    lastMsg: "Meeting at 5 PM?",
    time: "5h ago",
    avatar: "https://i.pravatar.cc/150?u=john",
    email: "john@alex.com",
  },
  {
    id: 4,
    name: "Rosy Done",
    role: "QA Engineer",
    loc: "Berlin, Germany",
    lastMsg: "Bugs have been fixed.",
    time: "7h ago",
    avatar: "https://i.pravatar.cc/150?u=rosy",
    email: "rosy@done.com",
  },
];

export default function WorkableChat() {
  const [activeTab, setActiveTab] = useState(1);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
      sender: "other",
      time: "10:20 AM",
    },
  ]);
  const [inputText, setInputText] = useState("");

  const activeUser = CONTACTS.find((u) => u.id === activeTab) || CONTACTS[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      text: inputText,
      sender: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, newMsg]);
    setInputText("");
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1400);
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
      <div className="flex h-screen w-full bg-[#E5D9F2] p-2 lg:p-4 gap-2 lg:gap-4 overflow-hidden font-sans text-slate-800 mt-16">
        <Navbar />
        {/* --- 1. LEFT ICON SIDEBAR --- 
          Hidden on mobile, visible from Large screens (lg) up */}
        <aside className="hidden lg:flex w-20 bg-[#4B164C] rounded-[40px] flex-col items-center py-8 relative shadow-2xl shrink-0">
          <div className="flex flex-col gap-8 text-white/50">
            <Home className="w-6 h-6 cursor-pointer hover:text-white" />
            <Users className="w-6 h-6 cursor-pointer hover:text-white" />
            <div className="bg-[#F3F4F6] p-4 rounded-l-[30px] -mr-4 text-[#4B164C] z-10 relative">
              <MessageSquare className="w-6 h-6" />
            </div>
            <FileText className="w-6 h-6 cursor-pointer hover:text-white" />
            <Video className="w-6 h-6 cursor-pointer hover:text-white" />
            <Bell className="w-6 h-6 cursor-pointer hover:text-white" />
            <Settings className="w-6 h-6 cursor-pointer hover:text-white" />
          </div>
          <div className="mt-auto flex flex-col items-center gap-2">
            <img
              src="https://i.pravatar.cc/150?u=admin"
              className="w-10 h-10 rounded-full border-2 border-orange-400 p-0.5"
              alt="Admin"
            />
            <span className="text-[10px] text-white/50 text-center leading-tight">
              Biplab
              <br />
              Patra
            </span>
          </div>
        </aside>

        {/* --- 2. CONTACTS LIST PANEL --- 
          Full width on mobile if view is 'list', 80 units wide on desktop */}
        <section
          className={`${mobileView === "list" ? "flex" : "hidden"} md:flex w-full md:w-72 lg:w-80 flex-col gap-4 shrink-0`}
        >
          <div className="bg-white rounded-[32px] p-6 flex-1 shadow-sm flex flex-col overflow-hidden">
            <h2 className="text-xl font-bold mb-4">Chat</h2>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full bg-[#F8F9FB] rounded-xl py-2.5 pl-10 text-sm focus:outline-none border border-slate-100 placeholder:text-slate-400"
                placeholder="Search..."
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {CONTACTS.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    setActiveTab(user.id);
                    setMobileView("chat");
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer ${activeTab === user.id ? "bg-slate-50 shadow-inner" : "hover:bg-slate-50"}`}
                >
                  <img
                    src={user.avatar}
                    className="w-11 h-11 rounded-full border-2 border-white shadow-sm"
                    alt=""
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-center">
                      <p
                        className={`font-bold text-sm truncate ${activeTab === user.id ? "text-[#4B164C]" : "text-slate-700"}`}
                      >
                        {user.name}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {user.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {user.lastMsg}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="bg-[#4B164C] text-white py-3 rounded-xl text-xs font-semibold shadow-lg shadow-purple-200">
                Meeting
              </button>
              <button className="bg-[#E5E7EB] text-slate-600 py-3 rounded-xl text-xs font-semibold">
                Schedule
              </button>
            </div>
          </div>
        </section>

        {/* --- 3. MAIN CHAT WINDOW --- 
          Visible if mobileView is 'chat' OR on screens larger than mobile (md) */}
        <main
          className={`${mobileView === "chat" ? "flex" : "hidden"} md:flex flex-1 bg-white rounded-[32px] shadow-sm flex-col overflow-hidden`}
        >
          <header className="px-4 lg:px-8 py-5 border-b border-slate-50 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileView("list")}
                className="md:hidden p-1 text-slate-400"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <img
                src={activeUser.avatar}
                className="w-10 h-10 rounded-full"
                alt=""
              />
              <div>
                <p className="font-bold text-slate-800 text-sm lg:text-base">
                  {activeUser.name}
                </p>
                <p className="text-[11px] text-green-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />{" "}
                  Online
                </p>
              </div>
            </div>
            <div className="flex gap-4 lg:gap-6 text-slate-400 items-center">
              <Phone className="w-5 h-5 cursor-pointer hover:text-[#4B164C]" />
              <VideoIcon className="w-5 h-5 cursor-pointer hover:text-[#4B164C]" />
              <MoreHorizontal className="w-5 h-5 cursor-pointer" />
            </div>
          </header>

          {/* Chat Feed */}
          <div className="flex-1 p-4 lg:p-8 overflow-y-auto space-y-6 bg-[#FBFCFE]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] lg:max-w-[75%] ${msg.sender === "me" ? "ml-auto flex-row-reverse" : ""}`}
              >
                {msg.sender === "other" && (
                  <img
                    src={activeUser.avatar}
                    className="w-8 h-8 rounded-full self-end mb-1"
                    alt=""
                  />
                )}
                <div
                  className={`flex flex-col ${msg.sender === "me" ? "items-end" : ""}`}
                >
                  <p className="text-[10px] text-slate-400 mb-1 px-2">
                    {msg.sender === "me"
                      ? "You"
                      : activeUser.name.split(" ")[0]}{" "}
                    • {msg.time}
                  </p>
                  <div
                    className={`p-4 rounded-[24px] text-sm shadow-sm ${
                      msg.sender === "me"
                        ? "bg-[#4B164C] text-white rounded-tr-none shadow-purple-100"
                        : "bg-white border border-slate-100 text-slate-600 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Form Input */}
          <footer className="p-4 lg:p-6">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-2 pl-4 rounded-[24px] focus-within:bg-white focus-within:border-purple-200 transition-all"
            >
              <Smile className="hidden sm:block w-5 h-5 text-slate-400 cursor-pointer" />
              <input
                className="flex-1 bg-transparent text-sm focus:outline-none"
                placeholder="Type message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className="flex items-center gap-2 pr-1">
                <Paperclip className="w-5 h-5 text-slate-400 cursor-pointer rotate-45" />
                <button
                  type="submit"
                  className="bg-[#4B164C] p-3 rounded-full text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </footer>
        </main>

        {/* --- 4. RIGHT PROFILE PANEL --- 
          Hidden on mobile and tablets. Only shows on large screens (xl and up) */}
        <aside className="hidden xl:flex w-72 lg:w-70 bg-white rounded-[32px] p-8 shadow-sm flex-col items-center shrink-0">
          <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-[6px] border-[#F3F4F6] overflow-hidden mb-4 shadow-inner">
            <img
              src={activeUser.avatar}
              className="w-full h-full object-cover"
              alt="Profile"
            />
          </div>

          <div className="text-center w-full">
            <h3 className="text-xl font-bold text-slate-800">
              {activeUser.name}
            </h3>
            <p className="text-sm text-slate-400">{activeUser.role}</p>
            <div className="flex items-center justify-center gap-1 text-[11px] text-red-400 mt-2 font-semibold">
              <MapPin className="w-3 h-3" /> {activeUser.loc}
            </div>
            {/* <div className="flex justify-center gap-3 mt-6">
              {["B", "W", "f"].map((icon, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 cursor-pointer hover:bg-[#4B164C] hover:text-white transition-all font-bold text-xs"
                >
                  {icon}
                </div>
              ))}
            </div> */}
          </div>

          <div className="w-full mt-8 space-y-4 pt-8 border-t border-slate-100 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">E-mail:</span>
              <span className="font-bold truncate ml-2">
                {activeUser.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DOB:</span>
              <span className="font-bold">01/01/2000</span>
            </div>
          </div>

          {/* <div className="w-full mt-auto pt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-800 text-sm">Media (24)</h4>
            <button className="text-[10px] text-slate-400 uppercase font-bold hover:text-[#4B164C]">
              See all
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <img
              src="https://picsum.photos/seed/a1/200"
              className="aspect-square rounded-2xl object-cover"
              alt=""
            />
            <img
              src="https://picsum.photos/seed/a2/200"
              className="aspect-square rounded-2xl object-cover"
              alt=""
            />
          </div>
        </div> */}
        </aside>
      </div>
    </>
  );
}
