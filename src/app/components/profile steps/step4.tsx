"use client";

import React, { useState, useEffect } from "react";
import AIInterviewCard from "@/app/components/interviewcard/card";

interface AIInterviewProps {
  skills: string[];
}

interface InterviewPart {
  name: string;
  type: string;
}

const AIInterview: React.FC<AIInterviewProps> = ({ skills }) => {
  const [started, setStarted] = useState(false);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes

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
      alert("⏰ Time is up! Interview finished.");
      setStarted(false);
      finishInterview();
    }
    return () => clearInterval(timer);
  }, [started, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
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

    setAnswers((prev) => [...prev, currentAnswer]);
    setCurrentAnswer("");

    // Next question in same part
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    // Move to next interview part
    if (currentPartIndex + 1 < interviewParts.length) {
      const nextPartIndex = currentPartIndex + 1;
      setCurrentPartIndex(nextPartIndex);
      await generateQuestions(interviewParts[nextPartIndex].type);
      return;
    }

    // If all parts done, evaluate
    finishInterview();
  };

  const finishInterview = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/evaluate-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills, answers }),
      });
      const data = await res.json();
      setResult(data.result);
    } catch (err) {
      console.error("Error evaluating answers:", err);
      setResult("Error evaluating answers.");
    } finally {
      setLoading(false);
    }
  };

  // If interview not started, show start card
  if (!started) return <AIInterviewCard onStart={handleStart} />;

  // Loading questions
  if (loading) return <p className="text-center text-xl mt-10 text-white">Loading questions...</p>;

  // Show final result
  if (result) {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white flex flex-col items-center justify-center z-50 p-6 overflow-auto">
        <h2 className="text-4xl font-bold mb-4 text-center">Interview Completed!</h2>
        <p className="text-2xl mb-6 text-center">Result: {result}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 mt-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 font-semibold hover:scale-105 transition"
        >
          Restart
        </button>
      </div>
    );
  }

  // Full-screen interview
  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col items-center justify-center z-50 p-6">
      <div className="absolute top-4 right-4 text-white text-lg font-mono">
        ⏱ Time Left: {formatTime(timeLeft)}
      </div>

      <h2 className="text-3xl font-bold mb-4 text-center">
        {interviewParts[currentPartIndex].name} Question {currentQuestionIndex + 1} / {questions.length}
      </h2>

      <p className="text-lg mb-6 text-center max-w-3xl">{questions[currentQuestionIndex]}</p>

      <input
        type="text"
        value={currentAnswer}
        onChange={(e) => setCurrentAnswer(e.target.value)}
        placeholder="Type your answer..."
        className="w-full max-w-2xl px-4 py-3 rounded-md text-gray-900"
      />

      <button
        onClick={handleNext}
        disabled={!currentAnswer.trim()}
        className={`mt-6 px-6 py-3 rounded-lg text-white text-lg font-semibold hover:scale-105 transition ${
          currentAnswer.trim()
            ? "bg-gradient-to-r from-purple-600 to-pink-500"
            : "bg-gray-600 cursor-not-allowed"
        }`}
      >
        Next
      </button>
    </div>
  );
};

export default AIInterview;
