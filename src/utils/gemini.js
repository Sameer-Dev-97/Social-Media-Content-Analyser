import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeWithGemini(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const prompt = `
Below is extracted text from a document or post:

${text}

Your task:
- Analyze the text and identify *specific*, *actionable* ways to make it more engaging if posted on social media.
- Tailor the suggestions ONLY to the content and style above; do NOT repeat generic advice.
- Think: Would YOU stop and respond to this in your feed? What specific edits, topics, or visual changes would create more comments, shares, or reactions?
- Output exactly 4-6 bullet points, each starting with "- ", each one a different engagement tip for THIS post—not broad tips.

Respond ONLY with the suggestions, as bullet points—do not summarize or include any section titles.
`;


  const result = await model.generateContent(prompt);
  return result.response.text();
}
