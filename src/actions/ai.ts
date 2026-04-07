"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function getCropAIInfo(cropName: string, country: string, state: string, season: string) {
  if (!process.env.GEMINI_API_KEY) {
    return { error: "AI service not configured." };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Provide a brief, practical guide about growing "${cropName}" in ${state}, ${country} during the ${season} season. Include:
1. Best soil type
2. Ideal temperature range
3. Water requirements
4. Common pests & diseases
5. Expected yield per hectare
6. Key tips for farmers

Keep it concise — max 200 words. Use plain text, no markdown headers.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return { info: text };
  } catch {
    return { error: "Failed to get AI information. Please try again." };
  }
}
