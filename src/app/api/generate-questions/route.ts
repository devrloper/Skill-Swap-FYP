import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { skills = [], partType } = await req.json();
    console.log("API received:", { skills, partType });

    // Clean up skills: replace "&" with "and" to avoid Gemini confusion
    const cleanSkills = skills.map((s: string) => s.replace("&", "and"));

    let prompt = "";

    switch (partType) {
      case "skill":
        prompt = cleanSkills.length
          ? `Generate 3 interview questions based on these skills: ${cleanSkills.join(
              ", ",
            )}. Return them as a numbered list.`
          : "Generate 3 general interview questions as a numbered list.";
        break;

      case "logical":
        prompt = cleanSkills.length
          ? `Generate 3 logical reasoning questions related to these skills: ${cleanSkills.join(
              ", ",
            )}. Return them as a numbered list.`
          : "Generate 3 general logical reasoning questions as a numbered list.";
        break;

      case "math":
        prompt = cleanSkills.length
          ? `Generate 3 math/quantitative questions related to these skills: ${cleanSkills.join(
              ", ",
            )}. Return them as a numbered list.`
          : "Generate 3 basic math/quantitative questions as a numbered list.";
        break;

      case "scenario":
        prompt = cleanSkills.length
          ? `Generate 2 scenario-based questions related to these skills: ${cleanSkills.join(
              ", ",
            )}. Return them as a numbered list.`
          : "Generate 2 general scenario-based questions as a numbered list.";
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

    // Split questions by numbered list pattern
    const questions = questionsText
      .split(/\d+\.\s+/)
      .map((q: string) => q.trim())
      .filter((q: string) => q.length > 0);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json(
      { questions: [], error: "Failed to generate questions" },
      { status: 500 },
    );
  }
}
