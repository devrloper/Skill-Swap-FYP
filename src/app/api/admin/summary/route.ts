import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { getSessionUser, isAdminEmail } from "@/app/lib/serverAuth";
import { extractProfileSkills, toMillis } from "@/app/lib/skill-request-utils";

export const dynamic = "force-dynamic";

type DocRecord = Record<string, unknown> & { id: string };
type RoleName = "learner" | "exchanger";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readString(data: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function readNumber(data: Record<string, unknown>, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function userRoles(data: Record<string, unknown>): RoleName[] {
  const roles = new Set<RoleName>();
  const role = data.role;
  if (role === "learner" || role === "exchanger") roles.add(role);
  if (Array.isArray(data.roles)) {
    data.roles.forEach((item) => {
      if (item === "learner" || item === "exchanger") roles.add(item);
    });
  }
  if (roles.size === 0) roles.add("exchanger");
  return Array.from(roles);
}

function displayName(user: DocRecord, profile?: DocRecord) {
  return (
    readString(asRecord(profile), ["fullName", "name", "displayName"]) ||
    readString(user, ["name", "displayName", "fullName"]) ||
    readString(user, ["email"], "User")
  );
}

function increment(map: Map<string, number>, key: string) {
  const clean = key.trim();
  if (!clean) return;
  map.set(clean, (map.get(clean) || 0) + 1);
}

function topItems(map: Map<string, number>, limit = 6) {
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function statusCount(docs: DocRecord[], status: string) {
  return docs.filter((doc) => readString(doc, ["status"]).toLowerCase() === status).length;
}

function dayKey(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offset);
  return date.toISOString().slice(0, 10);
}

function trendFor(docs: DocRecord[], dateKeys: string[], keys: string[]) {
  const counts = new Map(dateKeys.map((key) => [key, 0]));
  docs.forEach((doc) => {
    const millis = keys.map((key) => toMillis(doc[key])).find((value) => value > 0) || 0;
    if (!millis) return;
    const key = new Date(millis).toISOString().slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) || 0) + 1);
  });
  return dateKeys.map((key) => ({ date: key, value: counts.get(key) || 0 }));
}

async function collectionDocs(name: string): Promise<DocRecord[]> {
  const snap = await adminDb.collection(name).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdminEmail(sessionUser.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      users,
      profiles,
      learnerJourneys,
      skillRequests,
      legacyConnectRequests,
      sessions,
      interviews,
      creditPurchases,
      creditTransactions,
      userReports,
    ] = await Promise.all([
      collectionDocs("users"),
      collectionDocs("profiles"),
      collectionDocs("learnerJourneys"),
      collectionDocs("skillRequests"),
      collectionDocs("connectRequests"),
      collectionDocs("sessions"),
      collectionDocs("interviews"),
      collectionDocs("creditPurchases"),
      collectionDocs("creditTransactions"),
      collectionDocs("userReports"),
    ]);

    const requests = [...skillRequests, ...legacyConnectRequests];
    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
    const userMap = new Map(users.map((user) => [user.id, user]));
    const learnerIds = new Set<string>();
    const exchangerIds = new Set<string>();
    const bothRoleIds = new Set<string>();

    users.forEach((user) => {
      const roles = userRoles(user);
      if (roles.includes("learner")) learnerIds.add(user.id);
      if (roles.includes("exchanger")) exchangerIds.add(user.id);
      if (roles.includes("learner") && roles.includes("exchanger")) bothRoleIds.add(user.id);
    });

    const teachSkillCounts = new Map<string, number>();
    const learnSkillCounts = new Map<string, number>();
    profiles.forEach((profile) => {
      const skills = extractProfileSkills(profile);
      skills.teach.forEach((skill) => increment(teachSkillCounts, skill));
      skills.learn.forEach((skill) => increment(learnSkillCounts, skill));
    });
    learnerJourneys.forEach((journey) => {
      const skills = Array.isArray(journey.skills) ? journey.skills : [];
      skills.map(String).forEach((skill) => increment(learnSkillCounts, skill));
    });

    const requestedSkillCounts = new Map<string, number>();
    requests.forEach((request) => {
      increment(requestedSkillCounts, readString(request, ["requestedSkill", "skill"]));
    });

    const passProfiles = profiles.filter((profile) =>
      ["pass", "passed"].includes(readString(profile, ["interviewStatus"]).toLowerCase()),
    );
    const failProfiles = profiles.filter((profile) =>
      ["fail", "failed"].includes(readString(profile, ["interviewStatus"]).toLowerCase()),
    );
    const passInterviews = interviews.filter((interview) =>
      ["pass", "passed"].includes(readString(interview, ["result", "status"]).toLowerCase()),
    );
    const failInterviews = interviews.filter((interview) =>
      ["fail", "failed"].includes(readString(interview, ["result", "status"]).toLowerCase()),
    );
    const interviewsPass = Math.max(passProfiles.length, passInterviews.length);
    const interviewsFail = Math.max(failProfiles.length, failInterviews.length);

    const now = Date.now();
    const upcomingSessions = sessions.filter((session) => {
      const status = readString(session, ["status"]).toLowerCase();
      const start = toMillis(session.dateTime || session.meetingDateTime || session.schedule);
      return !["completed", "cancelled", "rejected"].includes(status) && start > now;
    });
    const completedSessions = statusCount(sessions, "completed");
    const cancelledSessions = sessions.filter((session) =>
      ["cancelled", "rejected"].includes(readString(session, ["status"]).toLowerCase()),
    ).length;

    const paidPurchases = creditPurchases.filter((purchase) =>
      ["paid", "completed", "succeeded"].includes(readString(purchase, ["status", "paymentStatus"]).toLowerCase()),
    );
    const revenue = paidPurchases.reduce(
      (sum, purchase) => sum + readNumber(purchase, ["amount", "amountPaid", "totalAmount", "price"]),
      0,
    );
    const totalCredits = users.reduce((sum, user) => sum + readNumber(user, ["credits"]), 0);
    const awardedCredits = creditTransactions.reduce(
      (sum, transaction) => sum + Math.max(0, readNumber(transaction, ["creditsDelta", "delta", "credits"])),
      0,
    );

    const acceptedRequests = requests.filter((request) =>
      ["accepted", "completed"].includes(readString(request, ["status"]).toLowerCase()),
    ).length;
    const requestAcceptanceRate = requests.length
      ? Math.round((acceptedRequests / requests.length) * 100)
      : 0;
    const profileCompletionRate = users.length
      ? Math.round((profiles.length / users.length) * 100)
      : 0;
    const learnerActivationRate = learnerIds.size
      ? Math.round((learnerJourneys.length / learnerIds.size) * 100)
      : 0;
    const sessionCompletionRate = sessions.length
      ? Math.round((completedSessions / sessions.length) * 100)
      : 0;

    const recentUsers = users
      .slice()
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      .slice(0, 12)
      .map((user) => {
        const profile = profileMap.get(user.id);
        const roles = userRoles(user);
        return {
          id: user.id,
          name: displayName(user, profile),
          email: readString(user, ["email"]),
          roles,
          credits: readNumber(user, ["credits"]),
          hasProfile: Boolean(profile),
          learnerJourney: learnerJourneys.some((journey) => journey.id === user.id),
          createdAt: toMillis(user.createdAt),
        };
      });

    const recentRequests = requests
      .slice()
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      .slice(0, 12)
      .map((request) => {
        const senderId = readString(request, ["senderId", "fromUserId"]);
        const receiverId = readString(request, ["receiverId", "toUserId"]);
        const sender = senderId ? userMap.get(senderId) : undefined;
        const receiver = receiverId ? userMap.get(receiverId) : undefined;
        return {
          id: request.id,
          senderId,
          receiverId,
          senderName:
            readString(request, ["senderName", "fromUserName"]) ||
            (sender ? displayName(sender, profileMap.get(senderId)) : "User"),
          receiverName:
            readString(request, ["receiverName", "toUserName"]) ||
            (receiver ? displayName(receiver, profileMap.get(receiverId)) : "User"),
          offeredSkill: readString(request, ["offeredSkill"]),
          requestedSkill: readString(request, ["requestedSkill", "skill"]),
          requestType: readString(request, ["requestType"], "skill_swap"),
          status: readString(request, ["status"], "pending"),
          createdAt: toMillis(request.createdAt),
        };
      });

    const failedInterviews = [...failProfiles, ...failInterviews]
      .map((item) => {
        const userId = readString(item, ["userId"], item.id);
        const user = userMap.get(userId) || ({ id: userId } as DocRecord);
        return {
          userId,
          name: displayName(user, profileMap.get(userId) || item),
          interviewScore: readNumber(item, ["interviewScore", "score"], -1),
        };
      })
      .sort((a, b) => a.interviewScore - b.interviewScore)
      .slice(0, 10);

    const recentReports = userReports
      .slice()
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      .slice(0, 10)
      .map((report) => {
        const reporterId = readString(report, ["reporterId"]);
        const reportedUserId = readString(report, ["reportedUserId"]);
        const reporter = reporterId ? userMap.get(reporterId) : undefined;
        const reportedUser = reportedUserId ? userMap.get(reportedUserId) : undefined;
        return {
          id: report.id,
          reporterId,
          reporterName: reporter ? displayName(reporter, profileMap.get(reporterId)) : "User",
          reportedUserId,
          reportedUserName: reportedUser
            ? displayName(reportedUser, profileMap.get(reportedUserId))
            : "User",
          reason: readString(report, ["reason"], "other"),
          details: readString(report, ["details"]),
          status: readString(report, ["status"], "open"),
          createdAt: toMillis(report.createdAt),
        };
      });

    const dateKeys = Array.from({ length: 7 }, (_, index) => dayKey(6 - index));
    const userTrend = trendFor(users, dateKeys, ["createdAt"]);
    const requestTrend = trendFor(requests, dateKeys, ["createdAt"]);
    const sessionTrend = trendFor(sessions, dateKeys, ["createdAt", "dateTime", "meetingDateTime"]);

    return NextResponse.json({
      totals: {
        users: users.length,
        learners: learnerIds.size,
        exchangers: exchangerIds.size,
        dualRoleUsers: bothRoleIds.size,
        profiles: profiles.length,
        learnerJourneys: learnerJourneys.length,
        requests: requests.length,
        pendingRequests: statusCount(requests, "pending"),
        acceptedRequests,
        rejectedRequests: statusCount(requests, "rejected"),
        sessions: sessions.length,
        upcomingSessions: upcomingSessions.length,
        completedSessions,
        cancelledSessions,
        interviewsPass,
        interviewsFail,
        totalCredits,
        awardedCredits,
        purchases: creditPurchases.length,
        revenue,
        openReports: userReports.filter((report) => readString(report, ["status"], "open") === "open").length,
      },
      health: {
        profileCompletionRate,
        learnerActivationRate,
        requestAcceptanceRate,
        sessionCompletionRate,
      },
      breakdowns: {
        usersByRole: [
          { name: "Exchangers", value: exchangerIds.size },
          { name: "Learners", value: learnerIds.size },
          { name: "Both", value: bothRoleIds.size },
        ],
        requestsByStatus: [
          { name: "Pending", value: statusCount(requests, "pending") },
          { name: "Accepted", value: acceptedRequests },
          { name: "Rejected", value: statusCount(requests, "rejected") },
        ],
        sessionsByStatus: [
          { name: "Upcoming", value: upcomingSessions.length },
          { name: "Completed", value: completedSessions },
          { name: "Cancelled", value: cancelledSessions },
        ],
      },
      trends: {
        users: userTrend,
        requests: requestTrend,
        sessions: sessionTrend,
      },
      skills: {
        topTeaching: topItems(teachSkillCounts),
        topLearning: topItems(learnSkillCounts),
        topRequested: topItems(requestedSkillCounts),
      },
      recent: {
        users: recentUsers,
        requests: recentRequests,
        failedInterviews,
        reports: recentReports,
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
