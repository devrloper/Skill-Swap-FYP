import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { toMillis } from "@/app/lib/skill-request-utils";

export const dynamic = "force-dynamic";

type DirectoryUser = Record<string, unknown> & {
  id: string;
  createdAt: number;
};

function normalizeDoc(id: string, data: Record<string, unknown>): DirectoryUser {
  return {
    id,
    ...data,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    photoUpdatedAt: toMillis(data.photoUpdatedAt) || data.photoUpdatedAt || null,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUserId = searchParams.get("userId")?.trim() || "";

    const [usersSnap, profilesSnap] = await Promise.all([
      adminDb.collection("users").get(),
      adminDb.collection("profiles").get(),
    ]);

    const usersMap = new Map<string, DirectoryUser>();

    usersSnap.docs.forEach((doc) => {
      usersMap.set(doc.id, normalizeDoc(doc.id, doc.data()));
    });

    profilesSnap.docs.forEach((doc) => {
      usersMap.set(doc.id, {
        ...(usersMap.get(doc.id) || { id: doc.id, createdAt: 0 }),
        ...normalizeDoc(doc.id, doc.data()),
      });
    });

    const users = Array.from(usersMap.values())
      .filter((user) => user.id && user.id !== currentUserId)
      .sort((a, b) => {
        const aName = String(a.fullName || a.name || a.displayName || "User");
        const bName = String(b.fullName || b.name || b.displayName || "User");
        return aName.localeCompare(bName);
      });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Error loading chat users:", err);
    return NextResponse.json(
      { error: "Failed to load chat users" },
      { status: 500 },
    );
  }
}
