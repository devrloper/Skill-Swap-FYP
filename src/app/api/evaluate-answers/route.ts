import { NextRequest, NextResponse } from "next/server";

interface QuestionItem {
  question: string;
  options: string[];
  answer?: string;
}

type AnswerBreakdownItem = {
  index: number;
  question: string;
  expected: string | null;
  given: string | null;
  isCorrect: boolean;
};

type WrongAnswerItem = {
  index: number;
  question: string;
  expected: string | null;
  given: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const { answers = [], questions = [] } = await req.json();

    const safeQuestions: QuestionItem[] = Array.isArray(questions) ? questions : [];
    const safeAnswers: string[] = Array.isArray(answers) ? answers : [];

    const total = Math.min(safeQuestions.length, safeAnswers.length);
    let correct = 0;
    const breakdown: AnswerBreakdownItem[] = [];
    const wrongAnswers: WrongAnswerItem[] = [];

    for (let i = 0; i < total; i += 1) {
      const expectedRaw = safeQuestions[i]?.answer ?? null;
      const givenRaw = safeAnswers[i] ?? null;
      const expected = expectedRaw ? expectedRaw.trim() : null;
      const given = givenRaw ? givenRaw.trim() : null;
      const isCorrect = Boolean(expected && given && expected === given);

      breakdown.push({
        index: i,
        question: safeQuestions[i]?.question ?? "",
        expected,
        given,
        isCorrect,
      });

      if (isCorrect) {
        correct += 1;
      } else {
        wrongAnswers.push({
          index: i,
          question: safeQuestions[i]?.question ?? "",
          expected,
          given,
        });
      }
    }

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const result = total > 0 && correct / total > 0.5 ? "Pass" : "Fail";

    return NextResponse.json({ result, score, correct, total, breakdown, wrongAnswers });
  } catch (error) {
    console.error("Evaluation Error:", error);
    return NextResponse.json(
      {
        result: "Fail",
        score: 0,
        correct: 0,
        total: 0,
        breakdown: [],
        wrongAnswers: [],
        error: "Server error",
      },
      { status: 500 },
    );
  }
}
