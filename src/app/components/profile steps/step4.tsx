"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import AIInterviewCard from "@/app/components/interviewcard/card";
import { auth, db } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

interface AIInterviewProps {
  skills: string[];
}

interface InterviewPart {
  name: string;
  type: string;
}
interface QuestionItem {
  question: string;
  options: string[];
  answer?: string;
}

type WrongAnswerItem = {
  index: number;
  question: string;
  expected: string | null;
  given: string | null;
};

type FinishInterviewFn = (
  finalAnswers?: string[],
  finalQuestions?: QuestionItem[],
  forcedFailReason?: string,
) => Promise<void>;

type RetryLock = {
  locked: boolean;
  remainingText: string;
  unlockAt: number;
};

const RETRY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const parseDateValue = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
};

const formatRetryTime = (milliseconds: number) => {
  const totalMinutes = Math.max(1, Math.ceil(milliseconds / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hourLabel = hours === 1 ? "hour" : "hours";
  const minuteLabel = minutes === 1 ? "minute" : "minutes";

  if (hours <= 0) return `${minutes} ${minuteLabel}`;
  if (minutes === 0) return `${hours} ${hourLabel}`;
  return `${hours} ${hourLabel} ${minutes} ${minuteLabel}`;
};

const getLatestDate = (values: unknown[]) =>
  values
    .map(parseDateValue)
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

const createRetryLock = (failedAt: Date): RetryLock | null => {
  const unlockAt = failedAt.getTime() + RETRY_COOLDOWN_MS;
  const remainingMs = unlockAt - Date.now();

  if (remainingMs <= 0) return null;

  return {
    locked: true,
    remainingText: formatRetryTime(remainingMs),
    unlockAt,
  };
};

const createRetryLockFromUnlockAt = (unlockAt: number): RetryLock | null => {
  const remainingMs = unlockAt - Date.now();

  if (remainingMs <= 0) return null;

  return {
    locked: true,
    remainingText: formatRetryTime(remainingMs),
    unlockAt,
  };
};

const AIInterview: React.FC<AIInterviewProps> = ({ skills }) => {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(
    () => auth.currentUser?.uid ?? null,
  );
  const [authReady, setAuthReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [allQuestions, setAllQuestions] = useState<QuestionItem[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [creditsDelta, setCreditsDelta] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes
  const [mounted, setMounted] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [disqualificationReason, setDisqualificationReason] = useState<string | null>(null);
  const [retryLock, setRetryLock] = useState<RetryLock | null>(null);
  const [checkingRetry, setCheckingRetry] = useState(true);
  const tabSwitchCountRef = useRef(0);
  const forcedFailRef = useRef(false);
  const finishInterviewRef = useRef<FinishInterviewFn | null>(null);

  const interviewParts: InterviewPart[] = [
    { name: "Skill-Based", type: "skill" },
    { name: "Logical / Analytical", type: "logical" },
    { name: "Math / Quantitative", type: "math" },
    { name: "Scenario-Based", type: "scenario" },
  ];

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (started && !result && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (started && !result && timeLeft === 0) {
      alert("Time is up! Interview finished.");
      finishInterviewRef.current?.();
    }
    return () => clearInterval(timer);
  }, [result, started, timeLeft]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (!userId) {
      setCheckingRetry(false);
      setRetryLock(null);
      return;
    }

    let cancelled = false;
    const loadRetryLock = async () => {
      setCheckingRetry(true);
      try {
        const [profileSnap, interviewSnap] = await Promise.all([
          getDoc(doc(db, "profiles", userId)),
          getDoc(doc(db, "interviews", userId)),
        ]);

        if (cancelled) return;

        const profile = profileSnap.exists() ? profileSnap.data() : null;
        const interview = interviewSnap.exists() ? interviewSnap.data() : null;
        const status = String(
          profile?.interviewStatus ||
            profile?.interview?.result ||
            interview?.result ||
            "",
        )
          .trim()
          .toLowerCase();

        if (!status.includes("fail")) {
          setRetryLock(null);
          return;
        }

        const failedAt = getLatestDate([
          profile?.lastFailedAt,
          profile?.interview?.lastFailedAt,
          profile?.interview?.completedAt,
          interview?.lastFailedAt,
          interview?.completedAt,
        ]);

        if (!failedAt) {
          setRetryLock(null);
          return;
        }

        setRetryLock(createRetryLock(failedAt));
      } catch (err) {
        console.error("Failed to check interview retry lock:", err);
        if (!cancelled) setRetryLock(null);
      } finally {
        if (!cancelled) setCheckingRetry(false);
      }
    };

    loadRetryLock();

    return () => {
      cancelled = true;
    };
  }, [authReady, userId]);

  useEffect(() => {
    if (!retryLock?.locked) return;

    const timer = setInterval(() => {
      const remainingMs = retryLock.unlockAt - Date.now();

      if (remainingMs <= 0) {
        setRetryLock(null);
        return;
      }

      setRetryLock((current) =>
        current?.locked
          ? { ...current, remainingText: formatRetryTime(remainingMs) }
          : current,
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [retryLock?.locked, retryLock?.unlockAt]);

  useEffect(() => {
    if (!started || result) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "hidden" || forcedFailRef.current) return;

      const nextCount = tabSwitchCountRef.current + 1;
      tabSwitchCountRef.current = nextCount;
      setTabSwitchCount(nextCount);

      if (nextCount > 3) {
        forcedFailRef.current = true;
        finishInterviewRef.current?.(
          answers,
          [...allQuestions, ...questions],
          "Tab switched more than 3 times during interview",
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [allQuestions, answers, questions, result, started]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    if (!authReady || checkingRetry || retryLock?.locked) return;

    setCurrentPartIndex(0);
    setCurrentQuestionIndex(0);
    setQuestions([]);
    setAnswers([]);
    setAllQuestions([]);
    setResult(null);
    setScore(null);
    setCorrectCount(null);
    setTotalCount(null);
    setCreditsDelta(0);
    setTimeLeft(5 * 60);
    setTabSwitchCount(0);
    setDisqualificationReason(null);
    tabSwitchCountRef.current = 0;
    forcedFailRef.current = false;
    setStarted(true);
    await generateQuestions(interviewParts[0].type);
  };

  const generateQuestions = async (partType: string) => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ skills, partType }),
      });
      const data = await res.json();

      if (res.status === 429 && data?.cooldownLocked) {
        const unlockAt =
          typeof data.unlockAt === "number" ? data.unlockAt : Date.now();
        setRetryLock(
          createRetryLockFromUnlockAt(unlockAt) || {
            locked: true,
            remainingText:
              typeof data.remainingText === "string"
                ? data.remainingText
                : "24 hours",
            unlockAt: Date.now() + RETRY_COOLDOWN_MS,
          },
        );
        setStarted(false);
        setQuestions([]);
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate questions");
      }

      setQuestions(data.questions || []);
      setCurrentQuestionIndex(0);
    } catch (err) {
      console.error("Error generating questions:", err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!currentAnswer.trim()) return; // Prevent empty answers

    const updatedAnswers = [...answers, currentAnswer];
    setAnswers(updatedAnswers);
    setCurrentAnswer("");

    // Next question in same part
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    const combinedQuestions = [...allQuestions, ...questions];

    // Move to next interview part
    if (currentPartIndex + 1 < interviewParts.length) {
      const nextPartIndex = currentPartIndex + 1;
      setAllQuestions(combinedQuestions);
      setCurrentPartIndex(nextPartIndex);
      await generateQuestions(interviewParts[nextPartIndex].type);
      return;
    }

    // If all parts done, evaluate
    finishInterview(updatedAnswers, combinedQuestions);
  };

  const finishInterview = async (
    finalAnswers: string[] = answers,
    finalQuestions: QuestionItem[] = [...allQuestions, ...questions],
    forcedFailReason = "",
  ) => {
    if (forcedFailReason) {
      setDisqualificationReason(forcedFailReason);
    }

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/evaluate-answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          answers: finalAnswers,
          questions: finalQuestions,
          forcedFailReason,
        }),
      });
      const data = await res.json();
      setResult(data.result);
      setScore(typeof data.score === "number" ? data.score : null);
      setCorrectCount(typeof data.correct === "number" ? data.correct : null);
      setTotalCount(typeof data.total === "number" ? data.total : null);
      setCreditsDelta(typeof data.creditsDelta === "number" ? data.creditsDelta : 0);

      if (userId) {
        const wrongAnswers: WrongAnswerItem[] = Array.isArray(data?.wrongAnswers)
          ? (data.wrongAnswers as WrongAnswerItem[])
          : [];
        const interviewResult = data.result === "Pass" ? "Pass" : "Fail";
        const completedAt = new Date().toISOString();

        await setDoc(
          doc(db, "profiles", userId),
          {
            enrolled: true,
            profileCompleted: true,
            enrolledAt: serverTimestamp(),
            interviewStatus: interviewResult,
            interviewScore: typeof data.score === "number" ? data.score : 0,
            ...(interviewResult === "Fail" ? { lastFailedAt: completedAt } : {}),
            interview: {
              result: interviewResult,
              score: typeof data.score === "number" ? data.score : 0,
              correct: typeof data.correct === "number" ? data.correct : 0,
              total: typeof data.total === "number" ? data.total : 0,
              wrongAnswers,
              ...(forcedFailReason ? { forcedFailReason } : {}),
              ...(interviewResult === "Fail" ? { lastFailedAt: completedAt } : {}),
              completedAt,
            },
          },
          { merge: true },
        );

        if (interviewResult === "Fail") {
          setRetryLock({
            locked: true,
            remainingText: "24 hours",
            unlockAt: Date.now() + RETRY_COOLDOWN_MS,
          });
        }
      }

      if (data.result === "Pass") {
        setTimeout(() => router.push("/matching"), 1200);
      }
    } catch (err) {
      console.error("Error evaluating answers:", err);
      setResult("Error evaluating answers.");
    } finally {
      setLoading(false);
    }
  };

  finishInterviewRef.current = finishInterview;

  // If interview not started, show start card
  if (!started)
    return (
      <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute -top-40 -left-20 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)]" />

        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-6 px-6 py-8">
          {!authReady || checkingRetry ? (
            <p className="text-center text-xl">Checking interview status...</p>
          ) : retryLock?.locked ? (
            <div className="relative flex w-full max-w-md flex-col items-center justify-center rounded-3xl border border-red-300/20 bg-white/5 p-8 text-center shadow-2xl backdrop-blur md:p-12">
              <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-cyan-400/30 blur-xl" />
              <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-fuchsia-500/30 blur-xl" />

              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-cyan-300 text-cyan-200">
                <svg
                  className="h-10 w-10"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-white md:text-3xl">
                You have failed the interview.
              </h2>
              <p className="mt-3 text-base font-semibold text-slate-200 md:text-lg">
                Try again after 24 hours.
              </p>
              <p className="mt-5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2 text-sm font-semibold text-cyan-100 md:text-base">
                Remaining time: {retryLock.remainingText}
              </p>
            </div>
          ) : (
            <>
              <AIInterviewCard onStart={handleStart} />
              <p className="text-sm text-slate-300">
                4 sections. 5 minutes total. Stay focused and answer clearly.
              </p>
            </>
          )}
        </div>
      </div>
    );

  const fullScreenView = loading ? (
    <div className="fixed inset-0 z-[9999] min-h-screen w-screen bg-slate-950 text-white flex items-center justify-center">
      <p className="text-center text-xl">Loading questions...</p>
    </div>
  ) : result ? (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col items-center justify-center z-[9999] p-6 overflow-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
        <div className="relative z-10 max-w-2xl text-center">
          <h2 className="text-4xl font-bold mb-4">Interview Completed!</h2>
          <p className="text-2xl mb-2">Result: {result}</p>
          {disqualificationReason && (
            <p className="text-sm text-red-200 mt-2">
              Interview failed because tabs were switched more than 3 times.
            </p>
          )}
          {score !== null && (
            <p className="text-xl text-slate-200">Marks: {score}/100</p>
          )}
          {correctCount !== null && totalCount !== null && (
            <p className="text-sm text-slate-300 mt-2">
              Correct: {correctCount} / {totalCount}
            </p>
          )}
          {result === "Pass" && (
            <p className="text-sm text-slate-300 mt-2">
              {creditsDelta > 0 ? `+${creditsDelta} credits added. ` : ""}
              Redirecting to matching...
            </p>
          )}
          {result === "Fail" && retryLock?.locked && (
            <p className="text-sm text-slate-300 mt-2">
              Try again after 24 hours. Remaining time:{" "}
              {retryLock.remainingText}
            </p>
          )}
        </div>
      {result !== "Pass" && !retryLock?.locked && (
        <button
          onClick={() => window.location.reload()}
          className="relative z-10 px-8 py-3 mt-4 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-500 font-semibold hover:scale-105 transition"
        >
          Restart
        </button>
      )}
    </div>
  ) : (
    <div className="fixed inset-0 bg-slate-950 text-white z-[9999] overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
      <div className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative z-10 flex min-h-screen w-screen flex-col items-center justify-center gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-200">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
              Section: {interviewParts[currentPartIndex].name}
            </span>
            <span className="font-mono">Time Left: {formatTime(timeLeft)}</span>
            <span
              className={`rounded-full border px-3 py-1 ${
                tabSwitchCount >= 3
                  ? "border-red-300/50 bg-red-500/20 text-red-100"
                  : "border-white/10 bg-white/10"
              }`}
            >
              Tab switches: {tabSwitchCount}/3
            </span>
          </div>

          <h2 className="mt-6 text-3xl font-bold text-center">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            <p className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-center text-base leading-7 text-slate-100 sm:text-lg">
              {questions[currentQuestionIndex]?.question}
            </p>

            {questions[currentQuestionIndex]?.options?.length ? (
              <div className="mt-6 grid grid-cols-1 gap-3">
                {questions[currentQuestionIndex].options.map((opt, idx) => {
                  const selected = currentAnswer === opt;
                  return (
                    <button
                      key={`${idx}-${opt}`}
                      onClick={() => setCurrentAnswer(opt)}
                      className={`w-full rounded-xl border px-4 py-3 text-left leading-6 transition break-words ${
                        selected
                          ? "border-cyan-300 bg-cyan-400/20 text-white"
                          : "border-white/10 bg-white/5 text-slate-100 hover:border-cyan-400/50"
                      }`}
                    >
                      <span className="mr-2 font-semibold text-slate-200">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6">
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full rounded-xl bg-white px-4 py-3 text-gray-900 outline-none ring-2 ring-transparent focus:ring-cyan-400"
                />
              </div>
            )}
            </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleNext}
              disabled={!currentAnswer.trim()}
              className={`px-8 py-3 rounded-full text-white text-lg font-semibold transition ${
                currentAnswer.trim()
                  ? "bg-gradient-to-r from-fuchsia-600 to-cyan-500 hover:scale-105"
                  : "bg-gray-600 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(fullScreenView, document.body) : null;
};

export default AIInterview;
