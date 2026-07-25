import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { groq } from "@/lib/groq";
import { generateText } from "ai";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return new NextResponse("Invalid prompt", { status: 400 });
    }

    const response = await generateText({
      model: groq("llama-3.1-8b-instant"),
      messages: [
        {
          role: "system",
          content: "You are an expert Prompt Engineer. Your job is to take a user's short, vague, or simple prompt and instantly rewrite it into a highly detailed, professional, and structured prompt that will guarantee the best possible response from a Master AI. Add context, constraints, tone, and formatting instructions if relevant. OUTPUT ONLY THE IMPROVED PROMPT. Do not include quotes, pleasantries, or explanations."
        },
        {
          role: "user",
          content: `Rewrite and vastly improve this prompt:\n\n${prompt}`
        }
      ]
    });

    return NextResponse.json({ improvedPrompt: response.text.trim() });
  } catch (error) {
    console.error("[IMPROVE_PROMPT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
