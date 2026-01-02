import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { ChatMessage } from "@/app/lib/types";

/* Create new chat */
export const createChat = async (userId: string, chatId: string) => {
  await setDoc(doc(db, "users", userId, "chats", chatId), {
    title: "New Chat",
    createdAt: serverTimestamp(),
  });
};

/* Save message */
export const saveMessage = async (
  userId: string,
  chatId: string,
  message: ChatMessage
) => {
  await addDoc(
    collection(db, "users", userId, "chats", chatId, "messages"),
    {
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      createdAt: serverTimestamp(),
    }
  );
};
