"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/app/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  canSendSkillRequest,
  hasCompletedProfile,
  hasInterviewCompleted,
  mergeUserProfileData,
} from "@/app/lib/skill-request-utils";

type SkillRequestPanelProps = {
  receiverId: string;
  receiverName: string;
  receiverTeachSkills: string[];
  receiverLearnSkills: string[];
};

type CurrentProfile = {
  fullName?: string;
  name?: string;
  displayName?: string;
  email?: string;
  location?: string;
  phone?: string;
  bio?: string;
  photoURL?: string;
  avatar?: string;
  image?: string;
  enrolled?: boolean;
  profileCompleted?: boolean;
  completedSteps?: number[];
  interviewStatus?: string;
  interviewScore?: number;
  interview?: unknown;
  skills?: {
    learnSkills?: string[];
    teachSkills?: string[];
    customLearnSkills?: string[];
    customTeachSkills?: string[];
  };
};

type ExistingRequest = {
  id: string;
  receiverId?: string;
  senderId?: string;
  status?: string;
  offeredSkill?: string;
  requestedSkill?: string;
  connectionId?: string | null;
  chatEnabled?: boolean;
  createdAt?: unknown;
};

function mergeSkills(profile?: CurrentProfile | null) {
  const teach = [
    ...(profile?.skills?.teachSkills || []),
    ...(profile?.skills?.customTeachSkills || []),
  ]
    .map((item) => item.trim())
    .filter(Boolean);
  const learn = [
    ...(profile?.skills?.learnSkills || []),
    ...(profile?.skills?.customLearnSkills || []),
  ]
    .map((item) => item.trim())
    .filter(Boolean);
  return { teach, learn };
}

export default function SkillRequestPanel({
  receiverId,
  receiverName,
  receiverTeachSkills,
  receiverLearnSkills,
}: SkillRequestPanelProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<CurrentProfile | null>(null);
  const [currentInterview, setCurrentInterview] = useState<Record<string, unknown> | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [offeredSkill, setOfferedSkill] = useState("");
  const [requestedSkill, setRequestedSkill] = useState("");
  const [message, setMessage] = useState("");
  const [schedule, setSchedule] = useState("");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingRequest, setExistingRequest] = useState<ExistingRequest | null>(null);
  const [requestLookupLoading, setRequestLookupLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) {
      setCurrentProfile(null);
      setCurrentInterview(null);
      setLoadingProfile(false);
      return;
    }

    let cancelled = false;
    setLoadingProfile(true);

    (async () => {
      try {
        const [profileResult, userResult, interviewResult] = await Promise.allSettled([
          getDoc(doc(db, "profiles", userId)),
          getDoc(doc(db, "users", userId)),
          getDoc(doc(db, "interviews", userId)),
        ]);

        const profileSnap =
          profileResult.status === "fulfilled" ? profileResult.value : null;
        const userSnap = userResult.status === "fulfilled" ? userResult.value : null;
        const interviewSnap =
          interviewResult.status === "fulfilled" ? interviewResult.value : null;

        const profileData = profileSnap?.exists()
          ? (profileSnap.data() as CurrentProfile)
          : null;
        const userData = userSnap?.exists() ? (userSnap.data() as CurrentProfile) : null;
        const interviewData = interviewSnap?.exists()
          ? (interviewSnap.data() as Record<string, unknown>)
          : null;
        const merged = mergeUserProfileData(userData, profileData) as CurrentProfile;

        if (!cancelled) {
          setCurrentProfile(merged);
          setCurrentInterview(interviewData);
        }
      } catch (err) {
        console.error("Failed to load current profile:", err);
        if (!cancelled) {
          setCurrentProfile(null);
          setCurrentInterview(null);
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const available = useMemo(() => mergeSkills(currentProfile), [currentProfile]);
  const profileReady = hasCompletedProfile(currentProfile);
  const interviewReady = hasInterviewCompleted(currentProfile, currentInterview);
  const canSend = canSendSkillRequest(currentProfile, currentInterview);

  useEffect(() => {
    if (!offeredSkill && available.teach.length) setOfferedSkill(available.teach[0]);
    if (!requestedSkill && receiverLearnSkills.length) {
      setRequestedSkill(receiverLearnSkills[0]);
    }
  }, [available.teach, offeredSkill, receiverLearnSkills, requestedSkill]);

  useEffect(() => {
    if (!userId || !receiverId) {
      setExistingRequest(null);
      setRequestLookupLoading(false);
      return;
    }

    let cancelled = false;
    setRequestLookupLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/connect-requests/list-v2?userId=${userId}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to check request status");

        const outgoing = Array.isArray(data?.outgoing) ? (data.outgoing as ExistingRequest[]) : [];
        const connections = Array.isArray(data?.connections) ? (data.connections as ExistingRequest[]) : [];

        const requestMatch = outgoing.find((req) => req.receiverId === receiverId) || null;
        const connectionMatch = connections.find((conn) => {
          const peers = Array.isArray((conn as { users?: string[] }).users)
            ? ((conn as { users?: string[] }).users || [])
            : [];
          return peers.includes(receiverId);
        }) || null;

        const nextRequest = connectionMatch
          ? {
              ...(requestMatch || {}),
              id: connectionMatch.id,
              receiverId,
              status: "accepted",
              connectionId: connectionMatch.id,
              chatEnabled: true,
            }
          : requestMatch;

        if (!cancelled) setExistingRequest(nextRequest);
      } catch (err) {
        console.error("Failed to load request status:", err);
        if (!cancelled) setExistingRequest(null);
      } finally {
        if (!cancelled) setRequestLookupLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, receiverId]);

  const requestStatus = String(existingRequest?.status || "");
  const isAlreadyConnected = requestStatus === "accepted" && Boolean(existingRequest?.chatEnabled);
  const isPendingRequest = requestStatus === "pending";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userId) {
      setError("Please sign in to send a request.");
      return;
    }

    if (!profileReady) {
      setError("Create your profile first.");
      return;
    }

    if (!interviewReady) {
      setError("Complete your AI interview first.");
      return;
    }

    if (isAlreadyConnected) {
      setError("You are already connected with this user.");
      return;
    }

    if (isPendingRequest) {
      setError("Request already sent. Waiting for response.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/connect-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId,
          offeredSkill,
          requestedSkill,
          message,
          schedule,
          duration,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409 && data?.alreadyRequested) {
          setSuccess(
            data?.requestStatus === "accepted"
              ? "You are already connected with this user."
              : "Request already sent. Waiting for response.",
          );
          setExistingRequest((prev) =>
            prev
              ? prev
              : {
                  id: data?.requestId || "",
                  receiverId,
                  status: data?.requestStatus || "pending",
                },
          );
          return;
        }
        throw new Error(data?.error || "Failed to send request");
      }

      setSuccess(data?.alreadyRequested ? "Request already sent." : "Request sent successfully.");
      setExistingRequest({
        id: data?.requestId || "",
        receiverId,
        status: "pending",
        offeredSkill,
        requestedSkill,
      });
      setMessage("");
      setSchedule("");
      setDuration("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request.");
    } finally {
      setSubmitting(false);
    }
  };

  const receiverHint = receiverTeachSkills.slice(0, 4).join(", ");

  return (
    <div className="max-h-[calc(100vh-14rem)] overflow-y-auto rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-black text-slate-800">Send Request</h2>
            <p className="text-sm text-slate-600 mt-1">
              Start a skill swap with {receiverName}.
            </p>
            {requestLookupLoading && (
              <p className="mt-2 text-xs text-slate-500">Checking request status...</p>
            )}
            {!requestLookupLoading && requestStatus === "pending" && (
              <p className="mt-2 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Request already sent. Waiting for response.
              </p>
            )}
            {!requestLookupLoading && requestStatus === "accepted" && (
              <p className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Already connected. Chat enabled.
              </p>
            )}
            {!requestLookupLoading && requestStatus === "rejected" && (
              <p className="mt-2 inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                Previous request was rejected. You may send again.
              </p>
            )}
            {receiverTeachSkills.length > 0 && (
              <p className="text-xs text-slate-500 mt-2">
                They can offer: <span className="font-semibold">{receiverHint}</span>
              </p>
            )}
          </div>
        </div>

        {!profileReady && userId && !loadingProfile && (
          <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            Create your profile first.
          </p>
        )}

        {!interviewReady && userId && profileReady && !loadingProfile && (
          <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            Complete your AI interview first.
          </p>
        )}

        <form className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Skill you offer
            </span>
            <select
              value={offeredSkill}
              onChange={(e) => setOfferedSkill(e.target.value)}
              disabled={!userId || loadingProfile || !available.teach.length || isPendingRequest || isAlreadyConnected}
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 ring-purple-200 disabled:opacity-60"
            >
              {!available.teach.length && <option value="">No teaching skills found</option>}
              {available.teach.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Skill you want to learn
            </span>
            <select
              value={requestedSkill}
              onChange={(e) => setRequestedSkill(e.target.value)}
              disabled={!userId || loadingProfile || !receiverLearnSkills.length || isPendingRequest || isAlreadyConnected}
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 ring-purple-200 disabled:opacity-60"
            >
              {!receiverLearnSkills.length && <option value="">No learning skills found</option>}
              {receiverLearnSkills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Message
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder={`Hi ${receiverName}, I'd love to swap skills with you.`}
              disabled={isPendingRequest || isAlreadyConnected}
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 ring-purple-200 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Schedule
            </span>
            <input
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="Optional schedule"
              disabled={isPendingRequest || isAlreadyConnected}
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 ring-purple-200 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Duration
            </span>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Optional duration"
              disabled={isPendingRequest || isAlreadyConnected}
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 ring-purple-200 disabled:opacity-60"
            />
          </label>

          {error && (
            <div className="md:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="md:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSend || submitting || loadingProfile || isPendingRequest || isAlreadyConnected}
            className="md:col-span-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-md hover:brightness-105 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isAlreadyConnected
              ? "Chat Enabled"
              : isPendingRequest
                ? "Request Sent"
                : submitting
                  ? "Sending..."
                  : "Send Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
