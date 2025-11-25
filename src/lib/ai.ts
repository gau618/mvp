import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Available writing tones
export type WritingTone =
  | "professional"
  | "casual"
  | "formal"
  | "friendly"
  | "creative"
  | "academic";

// Modify actions for AI suggestions
export type ModifyAction =
  | "shorten"
  | "expand"
  | "rephrase"
  | "formal"
  | "casual"
  | "summarize"
  | "improve"
  | "brainstorm";

export const TONE_OPTIONS: { value: WritingTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "friendly", label: "Friendly" },
  { value: "creative", label: "Creative" },
  { value: "academic", label: "Academic" },
];

const toneDescriptions: Record<WritingTone, string> = {
  professional: "in a professional, business-appropriate tone",
  casual: "in a casual, conversational tone",
  formal: "in a formal, polished tone",
  friendly: "in a warm, friendly tone",
  creative: "in a creative, expressive tone with vivid language",
  academic: "in an academic, scholarly tone",
};

// Generator function to yield text chunks as they arrive
export async function* generateContinuationStream(
  currentText: string,
  tone: WritingTone = "professional"
) {
  try {
    const toneInstruction = toneDescriptions[tone];
    const prompt = `Continue writing the following text naturally ${toneInstruction}. Write 2-3 more sentences. Do not repeat any of the original text. Just write the continuation:

"${currentText}"

Continue:`;

    const result = await model.generateContentStream(prompt);

    let fullResponse = "";
    let lastYieldedLength = 0;
    let isFirstChunk = true;

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        // Clean the response - remove newlines and extra spaces
        let cleaned = chunkText
          .replace(/[\r\n]+/g, " ")
          .replace(/\s{2,}/g, " ");

        for (const char of cleaned) {
          yield char;
          await new Promise((resolve) => setTimeout(resolve, 5)); // Add a 5ms delay
        }
      }
    }
  } catch (error) {
    console.error("Stream error:", error);
    throw error;
  }
}

// Modify text stream (shorten, expand, rephrase, etc.)
const modifyInstructions: Record<ModifyAction, string> = {
  shorten:
    "Make this text shorter and more concise while keeping the same meaning",
  expand: "Expand this text with more details and elaboration",
  rephrase:
    "Rephrase this text in a different way while keeping the same meaning",
  formal: "Rewrite this text in a more formal tone",
  casual: "Rewrite this text in a more casual, conversational tone",
  summarize: "Summarize the key points of this text in a concise way",
  improve:
    "Improve the quality, clarity, and flow of this text while keeping its meaning",
  brainstorm: "Generate creative ideas and suggestions related to this topic",
};

export async function* modifyTextStream(text: string, action: ModifyAction) {
  try {
    const instruction = modifyInstructions[action];
    const prompt = `${instruction}. Only output the modified text, nothing else:

"${text}"

Modified:`;

    const result = await model.generateContentStream(prompt);

    let fullResponse = "";
    let lastYieldedLength = 0;

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        // Clean the response
        const cleaned = chunkText
          .replace(/[\r\n]+/g, " ")
          .replace(/\s{2,}/g, " ");

        for (const char of cleaned) {
          yield char;
          await new Promise((resolve) => setTimeout(resolve, 5)); // Add a 5ms delay
        }
      }
    }
  } catch (error) {
    console.error("Modify stream error:", error);
    throw error;
  }
}
