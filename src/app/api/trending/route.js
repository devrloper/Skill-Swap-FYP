import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET() {
  const prompt = `
  List 9 trending tech skills in JSON format with this exact structure:
  [
    { "skill": "Skill Name", "description":"why it is trending" }
  ]
  Only return JSON, no extra text or formatting.
  `;

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  // Get the model output text
  const text = response.output[0].content[0].text;

  // Clean up if model adds ```json ... ```
  const cleanText = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    const data = JSON.parse(cleanText);
    return Response.json(data);
  } catch (error) {
    console.error("JSON parse error:", error, cleanText);
    return Response.json({ error: "Invalid JSON from model", raw: cleanText });
  }
}