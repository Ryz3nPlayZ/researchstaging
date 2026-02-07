
/**
 * DEPRECATED: This service is no longer used.
 * All AI chat now routes through the backend /api/chat endpoint via chatApi.
 * @see frontend3/lib/api.ts chatApi.send()
 */
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const askResearchAssistant = async (prompt: string, context?: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Using a stable fast model
      contents: `Context: ${context || 'General research workspace'}\n\nUser Question: ${prompt}`,
      config: {
        systemInstruction: "You are a world-class academic research assistant. Help the user with literature review, citation verification, summarization, and drafting. Keep responses professional, concise, and academically rigorous.",
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I encountered an error while processing your request. Please ensure your API key is valid.";
  }
};
