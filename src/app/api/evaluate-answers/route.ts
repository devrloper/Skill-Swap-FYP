import { NextRequest, NextResponse } from "next/server";

interface QuestionItem {
  question: string;
  options: string[];
  answer?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { answers = [], questions = [] } = await req.json();

    const safeQuestions: QuestionItem[] = Array.isArray(questions) ? questions : [];
    const safeAnswers: string[] = Array.isArray(answers) ? answers : [];

    const total = Math.min(safeQuestions.length, safeAnswers.length);
    let correct = 0;

    for (let i = 0; i < total; i += 1) {
      const expected = safeQuestions[i]?.answer;
      const given = safeAnswers[i];
      if (expected && given && expected.trim() === given.trim()) {
        correct += 1;
      }
    }

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const result = total > 0 && correct / total > 0.5 ? "Pass" : "Fail";

    return NextResponse.json({ result, score, correct, total });
  } catch (error) {
    console.error("Evaluation Error:", error);
    return NextResponse.json(
      { result: "Fail", score: 0, correct: 0, total: 0, error: "Server error" },
      { status: 500 },
    );
  }
}
