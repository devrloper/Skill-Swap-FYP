import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { getRequestUser } from "@/app/lib/serverAuth";
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
    const sessionUser = await getRequestUser(req);
    if (!sessionUser?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId")?.trim();
    const currentUserId = sessionUser.uid.trim();

    if (requestedUserId && requestedUserId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const connectionsSnap = await adminDb
      .collection("connections")
      .where("users", "array-contains", currentUserId)
      .get();

    const acceptedPeerIds = new Set<string>();
    connectionsSnap.docs.forEach((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const users = Array.isArray(data.users) ? data.users.map(String) : [];
      if (data.status !== "accepted" || data.chatEnabled === false) return;

      const peerId = users.find((id) => id && id !== currentUserId);
      if (peerId) acceptedPeerIds.add(peerId);
    });

    if (!acceptedPeerIds.size) {
      return NextResponse.json({ users: [] });
    }

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
      .filter((user) => acceptedPeerIds.has(user.id))
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
