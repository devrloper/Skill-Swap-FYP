"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import AIInterviewCard from "@/app/components/interviewcard/card";
import { auth, db } from "@/app/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

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

const AIInterview: React.FC<AIInterviewProps> = ({ skills }) => {
  const router = useRouter();
  const userId = auth.currentUser?.uid;
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
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes
  const [mounted, setMounted] = useState(false);

  const interviewParts: InterviewPart[] = [
    { name: "Skill-Based", type: "skill" },
    { name: "Logical / Analytical", type: "logical" },
    { name: "Math / Quantitative", type: "math" },
    { name: "Scenario-Based", type: "scenario" },
  ];

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (started && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (started && timeLeft === 0) {
      alert("Time is up! Interview finished.");
      setStarted(false);
      finishInterview();
    }
    return () => clearInterval(timer);
  }, [started, timeLeft]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    setCurrentPartIndex(0);
    setCurrentQuestionIndex(0);
    setQuestions([]);
    setAnswers([]);
    setAllQuestions([]);
    setResult(null);
    setScore(null);
    setCorrectCount(null);
    setTotalCount(null);
    setTimeLeft(5 * 60);
    setStarted(true);
    await generateQuestions(interviewParts[0].type);
  };

  const generateQuestions = async (partType: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills, partType }),
      });
      const data = await res.json();
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
  ) => {
    setLoading(true);
    try {
      const res = await fetch("/api/evaluate-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers, questions: finalQuestions }),
      });
      const data = await res.json();
      setResult(data.result);
      setScore(typeof data.score === "number" ? data.score : null);
      setCorrectCount(typeof data.correct === "number" ? data.correct : null);
      setTotalCount(typeof data.total === "number" ? data.total : null);

      if (userId) {
        await setDoc(
          doc(db, "profiles", userId),
          {
            interviewStatus: data.result === "Pass" ? "Pass" : "Fail",
            interviewScore: typeof data.score === "number" ? data.score : 0,
          },
          { merge: true },
        );
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

  // If interview not started, show start card
  if (!started)
    return (
      <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute -top-40 -left-20 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)]" />

        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-6 px-6 py-8">
          <AIInterviewCard onStart={handleStart} />
          <p className="text-sm text-slate-300">
            4 sections. 5 minutes total. Stay focused and answer clearly.
          </p>
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
              Redirecting to matching...
            </p>
          )}
        </div>
      {result !== "Pass" && (
        <button
          onClick={() => window.location.reload()}
          className="relative z-10 px-8 py-3 mt-4 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-500 font-semibold hover:scale-105 transition"
        >
          Restart
        </button>
      )}
    </div>
  ) : (
    <div className="fixed inset-0 bg-slate-950 text-white z-[9999]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
      <div className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative z-10 flex min-h-screen w-screen flex-col items-center justify-center gap-6 px-6 py-10">
        <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-200">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
              Section: {interviewParts[currentPartIndex].name}
            </span>
            <span className="font-mono">Time Left: {formatTime(timeLeft)}</span>
          </div>

          <h2 className="mt-6 text-3xl font-bold text-center">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>

          <p className="mt-4 text-lg text-center text-slate-100">
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
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
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
