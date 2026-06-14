import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { getRequestUser } from "@/app/lib/serverAuth";

type GeneratedQuestion = {
  question: string;
  options: string[];
  answer?: string;
};

const RETRY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function parseDateValue(value: unknown) {
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
}

function formatRetryTime(milliseconds: number) {
  const totalMinutes = Math.max(1, Math.ceil(milliseconds / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hourLabel = hours === 1 ? "hour" : "hours";
  const minuteLabel = minutes === 1 ? "minute" : "minutes";

  if (hours <= 0) return `${minutes} ${minuteLabel}`;
  if (minutes === 0) return `${hours} ${hourLabel}`;
  return `${hours} ${hourLabel} ${minutes} ${minuteLabel}`;
}

function getLatestDate(values: unknown[]) {
  return (
    values
      .map(parseDateValue)
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
  );
}

async function getInterviewCooldown(userId: string) {
  const [profileSnap, interviewSnap] = await Promise.all([
    adminDb.collection("profiles").doc(userId).get(),
    adminDb.collection("interviews").doc(userId).get(),
  ]);

  const profile = profileSnap.data() || {};
  const interview = interviewSnap.data() || {};
  const profileInterview =
    profile.interview && typeof profile.interview === "object"
      ? (profile.interview as Record<string, unknown>)
      : {};

  const status = String(
    profile.interviewStatus || profileInterview.result || interview.result || "",
  )
    .trim()
    .toLowerCase();

  if (!status.includes("fail")) return null;

  const failedAt = getLatestDate([
    profile.lastFailedAt,
    profileInterview.lastFailedAt,
    profileInterview.completedAt,
    interview.lastFailedAt,
    interview.completedAt,
  ]);

  if (!failedAt) return null;

  const unlockAt = failedAt.getTime() + RETRY_COOLDOWN_MS;
  const remainingMs = unlockAt - Date.now();

  if (remainingMs <= 0) return null;

  return {
    unlockAt,
    remainingMs,
    remainingText: formatRetryTime(remainingMs),
  };
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getRequestUser(req);

    if (!sessionUser?.uid) {
      return NextResponse.json(
        { questions: [], error: "Authentication required." },
        { status: 401 },
      );
    }

    const cooldown = await getInterviewCooldown(sessionUser.uid);
    if (cooldown) {
      return NextResponse.json(
        {
          questions: [],
          error: "Interview retry cooldown is active.",
          cooldownLocked: true,
          remainingText: cooldown.remainingText,
          unlockAt: cooldown.unlockAt,
        },
        { status: 429 },
      );
    }

    const { skills = [], partType } = await req.json();
    console.log("API received:", { skills, partType });

    // Clean up skills: replace "&" with "and" to avoid Gemini confusion
    const cleanSkills = Array.isArray(skills)
      ? skills.map((s: string) => s.replace("&", "and"))
      : [];

    let prompt = "";

    const jsonFormat =
      'Return ONLY a JSON array (no markdown) in this format: [{"question":"...","options":["...","...","...","..."],"answer":"..."}]. The "answer" must exactly match one of the options.';

    switch (partType) {
      case "skill":
        prompt = cleanSkills.length
          ? `Generate 3 interview questions based on these skills: ${cleanSkills.join(
              ", ",
            )}. Provide 4 clear multiple-choice options for each question. ${jsonFormat}`
          : `Generate 3 general interview questions. Provide 4 clear multiple-choice options for each question. ${jsonFormat}`;
        break;

      case "logical":
        prompt = cleanSkills.length
          ? `Generate 3 logical reasoning questions related to these skills: ${cleanSkills.join(
              ", ",
            )}. Provide 4 clear multiple-choice options for each question. ${jsonFormat}`
          : `Generate 3 general logical reasoning questions. Provide 4 clear multiple-choice options for each question. ${jsonFormat}`;
        break;

      case "math":
        prompt = cleanSkills.length
          ? `Generate 3 math/quantitative questions related to these skills: ${cleanSkills.join(
              ", ",
            )}. Provide 4 clear multiple-choice options for each question. ${jsonFormat}`
          : `Generate 3 basic math/quantitative questions. Provide 4 clear multiple-choice options for each question. ${jsonFormat}`;
        break;

      case "scenario":
        prompt = cleanSkills.length
          ? `Generate 2 scenario-based questions related to these skills: ${cleanSkills.join(
              ", ",
            )}. Provide 4 clear multiple-choice options for each question. ${jsonFormat}`
          : `Generate 2 general scenario-based questions. Provide 4 clear multiple-choice options for each question. ${jsonFormat}`;
        break;

      default:
        return NextResponse.json(
          { questions: [], error: "Invalid partType provided." },
          { status: 400 },
        );
    }

    console.log("Prompt sent to Gemini:", prompt);

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    const data = await geminiResponse.json();
    console.log("FULL Gemini response:", JSON.stringify(data, null, 2));

    // Check if Gemini returned candidates
    if (!data.candidates || data.candidates.length === 0) {
      return NextResponse.json(
        {
          questions: [],
          error: data.error?.message || "No questions returned from Gemini",
        },
        { status: 503 },
      );
    }

    // Extract text safely
    const questionsText = data.candidates[0].content.parts[0].text;
    console.log("Raw response from Gemini:", questionsText);

    // Try to parse JSON array
    let questions: GeneratedQuestion[] = [];
    try {
      const cleaned = questionsText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
      if (Array.isArray(parsed)) {
        questions = parsed
          .filter(
            (q: unknown): q is Record<string, unknown> =>
              Boolean(q) &&
              typeof q === "object" &&
              typeof (q as { question?: unknown }).question === "string",
          )
          .map((q: Record<string, unknown>) => ({
            question: String(q.question),
            options: Array.isArray(q.options) ? q.options.map(String) : [],
            answer: typeof q.answer === "string" ? q.answer : undefined,
          }));
      }
    } catch (e) {
      console.error("JSON parse error:", e);
    }

    // Fallback: Split by numbered list pattern
    if (questions.length === 0) {
      const fallback = questionsText
        .split(/\d+\.\s+/)
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 0);
      questions = fallback.map((q: string) => ({ question: q, options: [] }));
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json(
      { questions: [], error: "Failed to generate questions" },
      { status: 500 },
    );
  }
}
