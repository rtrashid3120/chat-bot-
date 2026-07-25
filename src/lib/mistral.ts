import { createOpenAI } from "@ai-sdk/openai";

// Mistral supports OpenAI-compatible API — most reliable integration
export const mistral = createOpenAI({
  apiKey: process.env.MISTRAL_API_KEY ?? "",
  baseURL: "https://api.mistral.ai/v1",
});
