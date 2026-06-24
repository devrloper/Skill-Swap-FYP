import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
].filter(Boolean) as string[];

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const userMessage = String(message || "").trim();

    if (!userMessage) {
      return NextResponse.json({ reply: "Please type a message first." }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ reply: "Chat is not configured yet. Please add the Gemini API key." });
    }

    const prompt = `You are "Skill Swap AI", a helpful assistant for Skill Swap company. 
    Be professional, concise, and friendly. 
    User message: ${userMessage}`;

    let lastError: unknown = null;
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return NextResponse.json({ reply: text });
      } catch (error) {
        lastError = error;
        console.error(`Gemini Error with ${modelName}:`, error);
      }
    }

    throw lastError;
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({
      reply:
        "I'm having trouble connecting to Gemini right now, but I can still help with SkillSwap basics: choose a skill, follow your learning path, practise, take the mock test, and pass 70% to get certified.",
    });
  }
}
