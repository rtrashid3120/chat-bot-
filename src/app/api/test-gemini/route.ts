import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function GET() {
  try {
    const res = await generateText({
      model: google('gemini-1.5-pro', { useSearchGrounding: true }),
      prompt: 'say hello',
    });
    return Response.json({ success: true, text: res.text, key_prefix: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.substring(0, 5) });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message, stack: err.stack, key_prefix: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.substring(0, 5) });
  }
}
