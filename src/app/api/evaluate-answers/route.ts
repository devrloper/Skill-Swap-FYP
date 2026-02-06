import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { skills = [], answers = [] } = await req.json();

    const prompt = `Evaluate the following answers for skills: ${skills.join(", ")}. Answers: ${answers.join(
      "; "
    )}. Provide a clear Pass or Fail based on correctness.`;

  const geminiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    }),
  }
);


    const data = await geminiResponse.json();
    const result = data.candidates?.[0]?.content?.trim() ?? "Fail";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Gemini Evaluation Error:", error);
    return NextResponse.json({ result: "Fail", error: "Server error" }, { status: 500 });
  }
}
