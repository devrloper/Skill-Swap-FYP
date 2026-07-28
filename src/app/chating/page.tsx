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
  Flag,
  Send,
  Paperclip,
  Smile,
  Download,
  ImageIcon,
  MapPin,
  ChevronLeft,
  Loader2,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Star,
  Mail,
  Fingerprint,
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
  writeBatch,
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
  caption?: string;
  senderId: string;
  receiverId: string;
  createdAt: number;
  type?: "text" | "schedule" | "attachment";
  attachment?: {
    name: string;
    url?: string;
    contentType: string;
    size: number;
    kind: "image" | "video" | "file";
    chunked?: boolean;
    chunkCount?: number;
  };
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

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const INLINE_ATTACHMENT_LIMIT = 450 * 1024;
const ATTACHMENT_CHUNK_SIZE = 450 * 1024;
const CHAT_EMOJIS = [
  "😊",
  "😂",
  "😍",
  "👍",
  "👏",
  "🙌",
  "🤝",
  "💡",
  "🔥",
  "✨",
  "🎯",
  "📚",
  "💻",
  "✅",
  "🙏",
  "😎",
  "🤔",
  "😅",
  "🥳",
  "❤️",
];

function getAttachmentKind(contentType: string): "image" | "video" | "file" {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  return "file";
}

function formatFileSize(size: number) {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function splitIntoChunks(value: string, size: number) {
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size));
  }
  return chunks;
}

function readFileAsDataUrl(file: File, onProgress: (progress: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 80));
    };

    reader.onerror = () => {
      reject(new Error("File could not be read. Please choose another file."));
    };

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        reject(new Error("File could not be read. Please choose another file."));
        return;
      }
      resolve(result);
    };

    reader.readAsDataURL(file);
  });
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function getUploadErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "File could not be prepared. Please try again with a smaller file.";
}

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("harassment");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);

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
              caption: getStringValue(data, ["caption"]),
              senderId: getStringValue(data, ["senderId"]),
              receiverId: getStringValue(data, ["receiverId"]),
              createdAt: toMillis(data.createdAt),
              type:
                data.type === "schedule"
                  ? "schedule"
                  : data.type === "attachment"
                    ? "attachment"
                    : "text",
              attachment:
                data.attachment && typeof data.attachment === "object"
                  ? {
                      name: getStringValue(data.attachment as FirestoreRecord, ["name"], "Attachment"),
                      url: getStringValue(data.attachment as FirestoreRecord, ["url"]),
                      contentType: getStringValue(data.attachment as FirestoreRecord, ["contentType"]),
                      size:
                        typeof (data.attachment as FirestoreRecord).size === "number"
                          ? ((data.attachment as FirestoreRecord).size as number)
                          : 0,
                      kind: ["image", "video"].includes(
                        String((data.attachment as FirestoreRecord).kind),
                      )
                        ? (String((data.attachment as FirestoreRecord).kind) as
                            | "image"
                            | "video")
                        : "file",
                      chunked: Boolean((data.attachment as FirestoreRecord).chunked),
                      chunkCount:
                        typeof (data.attachment as FirestoreRecord).chunkCount === "number"
                          ? ((data.attachment as FirestoreRecord).chunkCount as number)
                          : 0,
                    }
                  : undefined,
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

  const handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_SIZE) {
      showErrorToast(
        "File is too large",
        "Free mode supports files up to 650 KB. Please choose a smaller image or document.",
      );
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputText((current) => `${current}${emoji}`);
    setIsEmojiPickerOpen(false);
    window.setTimeout(() => messageInputRef.current?.focus(), 0);
  };

  const uploadChatAttachment = async (
    file: File,
  ): Promise<{
    attachment: NonNullable<ChatMessage["attachment"]>;
    chunks: string[];
  }> => {
    const dataUrl = await readFileAsDataUrl(file, setUploadProgress);
    const shouldChunk = dataUrl.length > INLINE_ATTACHMENT_LIMIT;
    const chunks = shouldChunk ? splitIntoChunks(dataUrl, ATTACHMENT_CHUNK_SIZE) : [];

    setUploadProgress(85);

    return {
      attachment: {
        name: file.name,
        url: shouldChunk ? undefined : dataUrl,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        kind: getAttachmentKind(file.type || ""),
        chunked: shouldChunk,
        chunkCount: chunks.length,
      },
      chunks,
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if ((!text && !selectedFile) || !activeUser || !user?.uid || isSending) return;

    setIsSending(true);
    setChatError("");

    try {
      let attachment:
        | {
            name: string;
            url?: string;
            contentType: string;
            size: number;
            kind: "image" | "video" | "file";
            chunked?: boolean;
            chunkCount?: number;
          }
        | undefined;
      let chunks: string[] = [];

      if (selectedFile) {
        const preparedAttachment = await uploadChatAttachment(selectedFile);
        attachment = preparedAttachment.attachment;
        chunks = preparedAttachment.chunks;
      }

      const previewText =
        text ||
        (attachment?.kind === "image"
          ? "Sent an image"
          : attachment?.kind === "video"
            ? "Sent a video"
            : `Sent ${attachment?.name || "a file"}`);
      const ensuredChatId = await ensureChatRoom(activeUser, previewText);
      const messageRef = doc(collection(db, "chatRooms", ensuredChatId, "messages"));

      await setDoc(messageRef, {
        text: previewText,
        caption: text,
        senderId: user.uid,
        receiverId: activeUser.id,
        readBy: [user.uid],
        type: attachment ? "attachment" : "text",
        ...(attachment ? { attachment } : {}),
        createdAt: Timestamp.now(),
      });

      if (chunks.length) {
        const batch = writeBatch(db);
        chunks.forEach((chunk, index) => {
          batch.set(doc(messageRef, "attachmentChunks", String(index).padStart(4, "0")), {
            index,
            data: chunk,
          });
        });
        await batch.commit();
      }

      setUploadProgress(100);
      setInputText("");
      clearSelectedFile();
    } catch (error) {
      console.error("Failed to send message:", error);
      const message = selectedFile
        ? getUploadErrorMessage(error)
        : "Message could not be sent. Please check Firestore write permissions.";
      showErrorToast("Message could not be sent", message);
      setChatError(message);
    } finally {
      setIsSending(false);
      setUploadProgress(0);
    }
  };

  const handleDownloadAttachment = async (message: ChatMessage) => {
    if (!activeUser || !user?.uid || !message.attachment) return;

    try {
      setDownloadingAttachmentId(message.id);

      if (message.attachment.url) {
        downloadDataUrl(message.attachment.url, message.attachment.name);
        return;
      }

      if (!message.attachment.chunked) {
        showErrorToast("File is not available", "This attachment could not be downloaded.");
        return;
      }

      const chatId = pairId(user.uid, activeUser.id);
      const chunksSnapshot = await getDocs(
        query(
          collection(
            db,
            "chatRooms",
            chatId,
            "messages",
            message.id,
            "attachmentChunks",
          ),
          orderBy("index", "asc"),
        ),
      );
      const dataUrl = chunksSnapshot.docs
        .map((chunkDoc) => getStringValue(chunkDoc.data() as FirestoreRecord, ["data"]))
        .join("");

      if (!dataUrl) {
        showErrorToast("File is not available", "Attachment data is missing.");
        return;
      }

      downloadDataUrl(dataUrl, message.attachment.name);
    } catch (error) {
      console.error("Failed to download attachment:", error);
      showErrorToast("Download failed", "File could not be downloaded. Please try again.");
    } finally {
      setDownloadingAttachmentId("");
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

  const handleSubmitReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeUser || !user?.uid || isSubmittingReport) return;

    setIsSubmittingReport(true);
    setChatError("");

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/reports", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportedUserId: activeUser.id,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || "Report could not be submitted.");
      }

      showAuthToast("Report submitted", "Admin will review this user.");
      setIsReportOpen(false);
      setReportReason("harassment");
      setReportDetails("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Report could not be submitted.";
      showErrorToast("Report failed", message);
      setChatError(message);
    } finally {
      setIsSubmittingReport(false);
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

      <div className="relative flex h-screen w-full gap-2 overflow-hidden bg-[radial-gradient(circle_at_top_left,#f8dcff_0%,transparent_32%),radial-gradient(circle_at_top_right,#ffe5f4_0%,transparent_30%),linear-gradient(135deg,#f3edff_0%,#eef7ff_44%,#fff1fa_100%)] p-2 font-sans text-slate-800 mt-16 lg:gap-4 lg:p-4">
        <Navbar />

        <aside className="hidden w-20 shrink-0 flex-col items-center rounded-[32px] bg-[#4B164C] py-8 shadow-[0_24px_60px_rgba(75,22,76,0.28)] lg:flex">
          <div className="flex flex-col gap-7 text-white/55">
            <Home className="h-6 w-6 cursor-pointer transition hover:scale-110 hover:text-white" />
            <Users className="h-6 w-6 cursor-pointer transition hover:scale-110 hover:text-white" />
            <div className="relative z-10 -mr-4 rounded-l-[24px] bg-white p-4 text-[#4B164C] shadow-[0_14px_32px_rgba(255,255,255,0.18)]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <FileText className="h-6 w-6 cursor-pointer transition hover:scale-110 hover:text-white" />
            <Video className="h-6 w-6 cursor-pointer transition hover:scale-110 hover:text-white" />
            <Bell className="h-6 w-6 cursor-pointer transition hover:scale-110 hover:text-white" />
            <Settings className="h-6 w-6 cursor-pointer transition hover:scale-110 hover:text-white" />
          </div>
          <div className="mt-auto flex w-full translate-y-3 flex-col items-center justify-center gap-2 px-2 pb-2 text-center">
            <img
              src={currentUserAvatar}
              className="mx-auto block h-11 w-11 rounded-full border-2 border-white/80 bg-white/10 p-0.5 object-cover shadow-lg"
              alt={currentUserName}
            />
            <span className="block w-full max-w-[64px] truncate text-center text-[10px] font-semibold leading-tight text-white/75">
              {currentUserName}
            </span>
          </div>
        </aside>

        <section
          className={`${mobileView === "list" ? "flex" : "hidden"} md:flex w-full md:w-72 lg:w-80 flex-col gap-4 shrink-0`}
        >
          <div className="flex flex-1 flex-col overflow-hidden rounded-[30px] border border-white/75 bg-white/85 p-5 shadow-[0_20px_60px_rgba(75,22,76,0.10)] backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9b7aad]">Skill Swap</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">Messages</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4B164C] text-white shadow-lg shadow-purple-200">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9b7aad]" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-2xl border border-purple-100 bg-white/90 py-3 pl-11 pr-4 text-sm shadow-inner outline-none transition placeholder:text-slate-400 focus:border-[#b789ff] focus:ring-4 focus:ring-purple-100"
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
                  className={`group flex w-full cursor-pointer items-center gap-3 rounded-3xl border p-3.5 transition-all ${
                    contact.unreadCount > 0
                      ? "border-purple-200 bg-purple-50/90 shadow-[0_12px_28px_rgba(126,34,206,0.10)]"
                      : activeUser?.id === contact.id
                        ? "border-[#eadbff] bg-white shadow-[0_12px_28px_rgba(75,22,76,0.08)]"
                        : "border-transparent bg-white/40 hover:border-purple-100 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={contact.avatar}
                      className="h-12 w-12 rounded-2xl border-2 border-white object-cover shadow-sm transition group-hover:scale-105"
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
                        <span className="shrink-0 rounded-full bg-[#4B164C] px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
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
          className={`${mobileView === "chat" ? "flex" : "hidden"} flex-1 flex-col overflow-hidden rounded-[30px] border border-white/75 bg-white/90 shadow-[0_20px_70px_rgba(75,22,76,0.10)] backdrop-blur-xl md:flex`}
        >
          {activeUser ? (
            <>
              <header className="flex items-center justify-between border-b border-purple-50 bg-white/85 px-4 py-4 lg:px-7">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileView("list")}
                    className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 md:hidden"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div className="relative">
                    <img
                      src={activeUser.avatar}
                      className="h-12 w-12 rounded-2xl border-2 border-white object-cover shadow-md"
                      alt={activeUser.name}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900 lg:text-base">
                      {activeUser.name}
                    </p>
                    <p className="truncate text-[11px] font-semibold text-[#9b7aad]">
                      {activeUser.email || activeUser.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#4B164C]">
                  <button type="button" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 transition hover:bg-purple-100">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button type="button" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 transition hover:bg-purple-100">
                    <VideoIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500 transition hover:bg-red-100"
                    aria-label={`Report ${activeUser.name}`}
                    title="Report user"
                  >
                    <Flag className="h-5 w-5" />
                  </button>
                </div>
              </header>

              <div className="flex-1 space-y-6 overflow-y-auto bg-[linear-gradient(180deg,#fbf9ff_0%,#ffffff_48%,#fff8fc_100%)] p-4 lg:p-8">
                {chatError && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {chatError}
                  </div>
                )}

                {!messages.length && !chatError && (
                  <div className="flex h-full min-h-80 items-center justify-center text-center">
                    <div className="rounded-[28px] border border-purple-100 bg-white/80 p-8 shadow-sm">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4B164C]/10 text-[#4B164C]">
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
                  const hasAttachment = message.type === "attachment" && message.attachment;
                  const attachmentUrl = message.attachment?.url || "";
                  const isDownloading = downloadingAttachmentId === message.id;
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
                            className={`w-[min(100%,26rem)] rounded-[26px] border p-4 text-sm shadow-sm ${
                              isMine
                                ? "rounded-tr-none border-[#4B164C] bg-[#4B164C] text-white shadow-purple-100"
                                : "rounded-tl-none border-purple-50 bg-white text-slate-700"
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
                        ) : hasAttachment ? (
                          <div
                            className={`max-w-[min(18rem,76vw)] overflow-hidden rounded-[26px] border text-sm shadow-sm sm:max-w-sm ${
                              isMine
                                ? "rounded-tr-none border-[#4B164C] bg-[#4B164C] text-white shadow-purple-100"
                                : "rounded-tl-none border-purple-50 bg-white text-slate-700"
                            }`}
                          >
                            {message.attachment?.kind === "image" && attachmentUrl && (
                              <a
                                href={attachmentUrl}
                                download={message.attachment.name}
                                target="_blank"
                                rel="noreferrer"
                                className="block"
                              >
                                <img
                                  src={attachmentUrl}
                                  alt={message.attachment.name}
                                  className="max-h-72 w-full object-cover"
                                />
                              </a>
                            )}

                            {message.attachment?.kind === "video" && attachmentUrl && (
                              <video
                                src={attachmentUrl}
                                controls
                                className="max-h-72 w-full bg-black"
                              >
                                <track kind="captions" />
                              </video>
                            )}

                            {(message.attachment?.kind === "file" || !attachmentUrl) && (
                              <button
                                type="button"
                                onClick={() => handleDownloadAttachment(message)}
                                disabled={isDownloading}
                                className={`flex items-center gap-3 p-4 transition ${
                                  isMine ? "hover:bg-white/10" : "hover:bg-purple-50"
                                } disabled:cursor-wait disabled:opacity-70`}
                              >
                                <span
                                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                                    isMine
                                      ? "bg-white/15 text-white"
                                      : "bg-[#4B164C]/10 text-[#4B164C]"
                                  }`}
                                >
                                  <FileText className="h-5 w-5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-bold">
                                    {message.attachment.name}
                                  </span>
                                  <span
                                    className={`mt-0.5 block text-xs ${
                                      isMine ? "text-white/70" : "text-slate-500"
                                    }`}
                                  >
                                    {formatFileSize(message.attachment.size)}
                                  </span>
                                </span>
                                {isDownloading ? (
                                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4 shrink-0" />
                                )}
                              </button>
                            )}

                            {(message.attachment?.kind !== "file" || message.caption) && (
                              <div className="space-y-1 px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {message.attachment?.kind === "image" ? (
                                    <ImageIcon className="h-4 w-4 shrink-0" />
                                  ) : (
                                    <Video className="h-4 w-4 shrink-0" />
                                  )}
                                  <a
                                    href={attachmentUrl || "#"}
                                    download={message.attachment?.name}
                                    onClick={(event) => {
                                      if (!attachmentUrl) {
                                        event.preventDefault();
                                        handleDownloadAttachment(message);
                                      }
                                    }}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`min-w-0 truncate text-xs font-semibold underline-offset-2 hover:underline ${
                                      isMine ? "text-white/80" : "text-[#4B164C]"
                                    }`}
                                  >
                                    {message.attachment?.name}
                                  </a>
                                </div>
                                {message.caption && (
                                  <p className="break-words text-sm leading-6">
                                    {message.caption}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className={`break-words rounded-[26px] border px-4 py-3 text-sm leading-6 shadow-sm ${
                              isMine
                                ? "rounded-tr-none border-[#4B164C] bg-[#4B164C] text-white shadow-purple-100"
                                : "rounded-tl-none border-purple-50 bg-white text-slate-600"
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

              <footer className="border-t border-purple-50 bg-white/85 p-4 lg:p-5">
                <form
                  onSubmit={handleSendMessage}
                  className="rounded-[26px] border border-purple-100 bg-white p-2 shadow-[0_12px_32px_rgba(75,22,76,0.08)] transition-all focus-within:border-[#b789ff] focus-within:ring-4 focus-within:ring-purple-100"
                >
                  {selectedFile && (
                    <div className="mb-2 rounded-2xl bg-purple-50 px-3 py-2 text-xs text-[#4B164C]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <Paperclip className="h-4 w-4 shrink-0 rotate-45" />
                          <span className="truncate font-semibold">
                            {selectedFile.name}
                          </span>
                          <span className="shrink-0 text-[#9b7aad]">
                            {formatFileSize(selectedFile.size)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={clearSelectedFile}
                          disabled={isSending}
                          className="shrink-0 rounded-full bg-white px-2 py-1 font-bold text-[#4B164C] transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                      {isSending && uploadProgress > 0 && (
                        <div className="mt-2">
                          <div className="h-1.5 overflow-hidden rounded-full bg-white">
                            <div
                              className="h-full rounded-full bg-[#4B164C] transition-all"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] font-semibold text-[#9b7aad]">
                            Uploading {uploadProgress}%
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="relative flex items-center gap-2 pl-2 sm:gap-3 sm:pl-4">
                    {isEmojiPickerOpen && (
                      <div className="absolute bottom-full left-0 z-20 mb-3 grid w-64 grid-cols-5 gap-1 rounded-3xl border border-purple-100 bg-white p-3 shadow-[0_18px_45px_rgba(75,22,76,0.18)]">
                        {CHAT_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiSelect(emoji)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl text-xl transition hover:bg-purple-50"
                            aria-label={`Add ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen((current) => !current)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-[#9b7aad] transition hover:bg-purple-100 hover:text-[#4B164C]"
                      aria-label="Open emoji picker"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                    <input
                      ref={messageInputRef}
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                      placeholder={
                        selectedFile
                          ? "Add a caption..."
                          : `Message ${activeUser.name}...`
                      }
                      value={inputText}
                      onChange={(event) => setInputText(event.target.value)}
                    />
                    <div className="flex items-center gap-1 pr-1 sm:gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                        onChange={handleSelectFile}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-[#4B164C] transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Attach file"
                      >
                        <Paperclip className="h-5 w-5 rotate-45" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsScheduleOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-[#4B164C]/15 bg-purple-50 px-3 py-2 text-xs font-bold text-[#4B164C] transition hover:bg-purple-100"
                      >
                        <CalendarDays className="h-4 w-4" />
                        <span className="hidden sm:inline">Schedule</span>
                      </button>
                      <button
                        type="submit"
                        disabled={(!inputText.trim() && !selectedFile) || isSending}
                        className="rounded-full bg-[#4B164C] p-3 text-white shadow-lg shadow-purple-200 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-[linear-gradient(180deg,#fbf9ff_0%,#fff8fc_100%)] p-8 text-center">
              <div className="rounded-[30px] border border-purple-100 bg-white/85 p-8 shadow-sm">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4B164C]/10 text-[#4B164C]">
                  <Users className="h-6 w-6" />
                </div>
                <p className="font-black text-slate-800">No chat users available</p>
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
              className="fixed inset-0 z-[90] flex h-[100dvh] items-start justify-center overflow-hidden bg-[#1f1024]/45 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
            >
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 w-full max-w-md flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white p-4 shadow-[0_24px_80px_rgba(31,16,36,0.28)] sm:max-h-[calc(100dvh-3rem)] sm:rounded-[30px] sm:p-6"
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
                    className="shrink-0 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-[#4B164C] transition hover:bg-purple-100 sm:text-sm"
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
                      className="w-full min-w-0 rounded-2xl border border-purple-100 px-4 py-3 text-sm outline-none transition focus:border-[#b789ff] focus:ring-4 focus:ring-purple-100"
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
                        className="w-full min-w-0 rounded-2xl border border-purple-100 px-3 py-3 text-sm outline-none transition focus:border-[#b789ff] focus:ring-4 focus:ring-purple-100 sm:px-4"
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
                        className="w-full min-w-0 rounded-2xl border border-purple-100 px-4 py-3 text-sm outline-none transition focus:border-[#b789ff] focus:ring-4 focus:ring-purple-100"
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
                      className="min-h-24 w-full min-w-0 resize-none rounded-2xl border border-purple-100 px-4 py-3 text-sm outline-none transition focus:border-[#b789ff] focus:ring-4 focus:ring-purple-100"
                      placeholder="Add agenda or meeting details"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isScheduling}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4B164C] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-[#3d103e] disabled:cursor-not-allowed disabled:opacity-60"
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
          {isReportOpen && activeUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[95] flex items-center justify-center bg-[#1f1024]/45 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: 24, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 24, opacity: 0, scale: 0.96 }}
                className="w-full max-w-md rounded-[30px] border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(31,16,36,0.28)]"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                      <Flag className="h-5 w-5" />
                    </div>
                    <p className="text-lg font-bold text-slate-800">
                      Report {activeUser.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Tell admin what happened. Reports are private.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="rounded-full bg-slate-50 px-3 py-1 text-sm font-bold text-slate-500 transition hover:bg-slate-100"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleSubmitReport} className="space-y-5">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Reason
                    </span>
                    <select
                      value={reportReason}
                      onChange={(event) => setReportReason(event.target.value)}
                      className="w-full rounded-2xl border border-purple-100 px-4 py-3 text-sm outline-none transition focus:border-[#b789ff] focus:ring-4 focus:ring-purple-100"
                    >
                      <option value="harassment">Harassment or rude behavior</option>
                      <option value="spam">Spam or unwanted messages</option>
                      <option value="inappropriate_content">Inappropriate content</option>
                      <option value="fake_profile">Fake profile</option>
                      <option value="unsafe_behavior">Unsafe behavior</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Details
                    </span>
                    <textarea
                      value={reportDetails}
                      onChange={(event) => setReportDetails(event.target.value)}
                      maxLength={1000}
                      className="min-h-28 w-full resize-none rounded-2xl border border-purple-100 px-4 py-3 text-sm outline-none transition focus:border-[#b789ff] focus:ring-4 focus:ring-purple-100"
                      placeholder="Write a short note for admin review"
                    />
                    <span className="mt-1 block text-right text-[10px] font-semibold text-slate-400">
                      {reportDetails.length}/1000
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmittingReport ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Flag className="h-4 w-4" />
                    )}
                    Submit Report
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
              className="fixed inset-0 z-[95] flex items-center justify-center bg-[#1f1024]/45 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: 24, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 24, opacity: 0, scale: 0.96 }}
                className="w-full max-w-md rounded-[30px] border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(31,16,36,0.28)]"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-slate-800">Rate this meeting</p>
                    <p className="mt-1 text-sm text-slate-500">{feedbackTarget.topic}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedbackTarget(null)}
                    className="rounded-full bg-purple-50 px-3 py-1 text-sm font-bold text-[#4B164C] transition hover:bg-purple-100"
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
                      className="min-h-28 w-full resize-none rounded-2xl border border-purple-100 px-4 py-3 text-sm outline-none transition focus:border-[#b789ff] focus:ring-4 focus:ring-purple-100"
                      placeholder="Share what went well or what could be improved"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4B164C] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-[#3d103e] disabled:cursor-not-allowed disabled:opacity-60"
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
          <aside className="hidden w-72 shrink-0 overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_18px_50px_rgba(75,22,76,0.12)] xl:flex lg:w-70 flex-col">
            <div className="relative flex flex-col items-center px-7 pb-7 pt-8 text-center">
              <div className="absolute inset-x-0 top-0 h-36 bg-[linear-gradient(135deg,#f7f0ff_0%,#fce8f5_48%,#fff7ed_100%)]" />
              <div className="absolute left-6 top-5 h-16 w-16 rounded-full bg-white/70 blur-xl" />
              <div className="absolute right-5 top-14 h-20 w-20 rounded-full bg-violet-200/35 blur-2xl" />

              <div className="relative mb-4 rounded-full bg-white p-2 shadow-[0_16px_35px_rgba(75,22,76,0.14)]">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-[#D9C4FF] bg-[#F7ECFF] lg:h-36 lg:w-36">
                  <img
                    src={activeUser.avatar}
                    className="h-full w-full object-cover"
                    alt={activeUser.name}
                  />
                </div>
                <span className="absolute bottom-4 right-4 h-4 w-4 rounded-full border-2 border-white bg-emerald-400 shadow-sm" />
              </div>

              <h3 className="relative max-w-full truncate text-2xl font-extrabold text-slate-900">
                {activeUser.name}
              </h3>
              <div className="relative mt-2 rounded-full bg-[#F7ECFF] px-4 py-1 text-xs font-bold capitalize text-[#7c1d8a]">
                {activeUser.role || "member"}
              </div>
              <div className="relative mt-3 inline-flex max-w-full items-center justify-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{activeUser.location}</span>
              </div>
            </div>

            <div className="mx-6 mb-7 space-y-3 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 text-xs">
              <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7c1d8a]">
                  <Mail className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-400">E-mail</p>
                  <p className="truncate font-extrabold text-slate-900">
                    {activeUser.email || "Not added"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
                  <Fingerprint className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-400">User ID</p>
                  <p className="truncate font-extrabold text-slate-900">{activeUser.id}</p>
                </div>
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
