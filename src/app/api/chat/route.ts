import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful AI assistant for the SkillSwap website." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return NextResponse.json({ text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
