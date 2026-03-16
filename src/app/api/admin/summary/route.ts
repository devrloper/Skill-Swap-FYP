import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

type ConnectRequestDoc = {
  id: string;
  fromUserId?: string;
  toUserId?: string;
  status?: string;
  createdAt?: unknown;
  fromUserName?: string | null;
};

type ProfileDoc = {
  id: string;
  fullName?: string;
  name?: string;
  displayName?: string;
  interviewScore?: number;
};

function toMillis(value: unknown): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyValue = value as any;
  if (anyValue?.toMillis) return Number(anyValue.toMillis());
  if (value instanceof Date) return value.getTime();
  return 0;
}

async function safeCount(
  ref: FirebaseFirestore.Query | FirebaseFirestore.CollectionReference,
) {
  // Prefer aggregation count() when available, fallback to .get().size
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyRef = ref as any;
  try {
    if (typeof anyRef.count === "function") {
      const snap = await anyRef.count().get();
      const data = snap.data();
      if (typeof data?.count === "number") return data.count as number;
    }
  } catch {
    // ignore
  }

  const snap = await ref.get();
  return snap.size;
}

async function loadProfileNames(userIds: string[]) {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return {} as Record<string, string>;

  const refs = unique.map((id) => adminDb.collection("profiles").doc(id));
  const snaps = await adminDb.getAll(...refs);

  const map: Record<string, string> = {};
  for (let i = 0; i < snaps.length; i++) {
    const snap = snaps[i];
    if (!snap.exists) continue;
    const data = snap.data() || {};
    map[unique[i]] = (data.fullName || data.name || data.displayName || "User") as string;
  }
  return map;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const recentLimitParam = Number(searchParams.get("recentLimit") || "10");
    const recentLimit = Number.isFinite(recentLimitParam)
      ? Math.min(Math.max(recentLimitParam, 5), 25)
      : 10;

    const usersRef = adminDb.collection("users");
    const profilesRef = adminDb.collection("profiles");
    const connectRequestsRef = adminDb.collection("connectRequests");

    const [
      totalUsers,
      totalProfiles,
      passCount,
      failCount,
      pendingConnectCount,
      pendingConnectSnap,
      failedProfilesSnap,
    ] = await Promise.all([
      safeCount(usersRef),
      safeCount(profilesRef),
      safeCount(profilesRef.where("interviewStatus", "==", "Pass")),
      safeCount(profilesRef.where("interviewStatus", "==", "Fail")),
      safeCount(connectRequestsRef.where("status", "==", "pending")),
      connectRequestsRef.where("status", "==", "pending").limit(50).get(),
      profilesRef.where("interviewStatus", "==", "Fail").limit(50).get(),
    ]);

    const pendingConnect: ConnectRequestDoc[] = pendingConnectSnap.docs
      .map(
        (doc) => ({ id: doc.id, ...(doc.data() as object) }) as ConnectRequestDoc,
      )
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      .slice(0, recentLimit);

    const nameMap = await loadProfileNames([
      ...pendingConnect.map((r) => r.fromUserId || ""),
      ...pendingConnect.map((r) => r.toUserId || ""),
      ...failedProfilesSnap.docs.map((d) => d.id),
    ]);

    const pendingConnectEnriched = pendingConnect.map((r) => ({
      id: r.id,
      fromUserId: r.fromUserId || "",
      toUserId: r.toUserId || "",
      status: r.status || "pending",
      createdAt: r.createdAt || null,
      fromUserName:
        r.fromUserName || (r.fromUserId ? nameMap[r.fromUserId] : null) || null,
      toUserName: r.toUserId ? nameMap[r.toUserId] || null : null,
    }));

    const failedInterviews = failedProfilesSnap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as object) }) as ProfileDoc)
      .map((p) => ({
        userId: p.id,
        name: p.fullName || p.name || p.displayName || nameMap[p.id] || "User",
        interviewScore:
          typeof p.interviewScore === "number" ? p.interviewScore : null,
      }))
      .sort((a, b) => (a.interviewScore ?? 999) - (b.interviewScore ?? 999))
      .slice(0, recentLimit);

    return NextResponse.json({
      totals: {
        users: totalUsers,
        profiles: totalProfiles,
        interviewsPass: passCount,
        interviewsFail: failCount,
        connectPending: pendingConnectCount,
      },
      recent: {
        pendingConnect: pendingConnectEnriched,
        failedInterviews,
      },
    });
  } catch (err) {
    console.error("Error building admin summary:", err);
    return NextResponse.json(
      { error: "Failed to load admin summary" },
      { status: 500 },
    );
  }
}
