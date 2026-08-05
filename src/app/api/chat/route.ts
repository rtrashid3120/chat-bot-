import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const PERSONA_PROMPTS: Record<string, string> = {
  "default": "You are Promptly-AI, a helpful, friendly, and concise AI assistant powered by Google Gemini. Your creator and owner is Mohamed Rashid. If anyone asks who made you, who owns you, or who your creator is, you must proudly say that you were created by Mohamed Rashid.",
  "coding": "You are Promptly-AI, an expert programmer powered by Google Gemini. Provide clean, robust, well-documented code. Explain your reasoning clearly. Your creator and owner is Mohamed Rashid. If asked, state that you were created by him.",
  "creative": "You are Promptly-AI, a creative and imaginative writer powered by Google Gemini. Express ideas with flair, vivid language, and engaging tone. Your creator and owner is Mohamed Rashid. If asked, state that you were created by him."
};

// Pure Gemini Models list to try in order
const GEMINI_MODELS = [
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-2.0-flash-exp",
  "gemini-1.0-pro"
];

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { messages, id, model: selectedModel, persona, imageBase64 } = body;

    if (!messages || messages.length === 0) {
      return new Response("No messages provided", { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const userId = session.user.id as string;

    // Detect Google Gemini API key from multiple possible environment variables
    const googleApiKey = 
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || 
      process.env.GEMINI_API_KEY || 
      process.env.GOOGLE_API_KEY;

    if (!googleApiKey || googleApiKey.trim() === "") {
      const errorMessage = "⚠️ **Gemini API Key Missing**: Please add `GOOGLE_GENERATIVE_AI_API_KEY` to your Vercel Environment Variables and redeploy.";
      return new Response(`0:${JSON.stringify(errorMessage)}\n`, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Vercel-AI-Data-Stream": "v1",
        },
      });
    }

    const google = createGoogleGenerativeAI({
      apiKey: googleApiKey,
    });

    // Save user message to DB
    if (id) {
      const conv = await prisma.conversation.findUnique({
        where: { id, userId },
        select: { title: true },
      });

      const isDefaultTitle = !conv || conv.title === "New Chat" || conv.title.trim() === "";
      let snippetTitle = "Image Upload";
      
      if (typeof lastMessage.content === "string") {
        snippetTitle = lastMessage.content.length > 35
          ? `${lastMessage.content.slice(0, 35)}...`
          : lastMessage.content || "Image Upload";
      }

      await prisma.message.create({
        data: {
          conversationId: id,
          role: "user",
          content: typeof lastMessage.content === "string" ? lastMessage.content : "[Image Uploaded]",
          model: selectedModel || "gemini-1.5-pro",
        },
      });

      await prisma.conversation.update({
        where: { id, userId },
        data: {
          ...(isDefaultTitle ? { title: snippetTitle } : {}),
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
        },
      });
    }

    // Build system prompt
    const basePersona = PERSONA_PROMPTS[persona as string] || PERSONA_PROMPTS["default"];
    
    // Process messages for Vision if image is present
    const formattedMessages = [...messages];
    if (imageBase64) {
      const lastUserMsgIdx = formattedMessages.findLastIndex((m: { role: string }) => m.role === "user");
      if (lastUserMsgIdx !== -1) {
        const textContent = formattedMessages[lastUserMsgIdx].content;
        formattedMessages[lastUserMsgIdx] = {
          ...formattedMessages[lastUserMsgIdx],
          content: [
            { type: "text", text: typeof textContent === "string" && textContent.trim() ? textContent : "Please analyze this image." },
            { type: "image", image: imageBase64 }
          ]
        };
      }
    }

    const messagesForModel = [
      { role: "system", content: basePersona },
      ...formattedMessages
    ];

    // Priority model sequence: Use selected model if provided, followed by remaining Gemini fallbacks
    const requestedModel = (selectedModel && selectedModel.startsWith("gemini")) ? selectedModel : "gemini-1.5-pro";
    const modelCandidates = Array.from(new Set([requestedModel, ...GEMINI_MODELS]));

    let lastError: Error | null = null;

    // Loop through Gemini model candidates to ensure a successful response
    for (const modelName of modelCandidates) {
      try {
        console.log(`Attempting Gemini stream with model: ${modelName}`);
        
        // Attempt stream with Search Grounding enabled
        const result = streamText({
          model: google(modelName, { useSearchGrounding: true }),
          messages: messagesForModel,
          onFinish: async ({ text, usage }) => {
            if (id) {
              await prisma.message.create({
                data: {
                  conversationId: id,
                  role: "assistant",
                  content: text,
                  model: modelName,
                  tokens: usage?.totalTokens || 0,
                },
              });

              await prisma.conversation.update({
                where: { id },
                data: { messageCount: { increment: 1 } },
              });

              await prisma.usageRecord.create({
                data: {
                  userId,
                  conversationId: id,
                  model: modelName,
                  inputTokens: usage?.promptTokens || 0,
                  outputTokens: usage?.completionTokens || 0,
                  totalTokens: usage?.totalTokens || 0,
                  cost: 0,
                },
              });
            }
          },
        });

        return result.toDataStreamResponse();
      } catch (err: any) {
        console.warn(`Gemini model ${modelName} failed:`, err?.message || err);
        lastError = err;
        // Continue loop to next candidate
      }
    }

    // If search grounding fails on all, try standard Gemini without search grounding
    for (const modelName of modelCandidates) {
      try {
        console.log(`Attempting Gemini stream without grounding: ${modelName}`);
        const result = streamText({
          model: google(modelName),
          messages: messagesForModel,
          onFinish: async ({ text, usage }) => {
            if (id && text) {
              await prisma.message.create({
                data: {
                  conversationId: id,
                  role: "assistant",
                  content: text,
                  model: modelName,
                  tokens: usage?.totalTokens || 0,
                },
              });
            }
          },
        });
        return result.toDataStreamResponse();
      } catch (err: any) {
        lastError = err;
      }
    }

    // If all Gemini attempts fail, return helpful diagnostic stream message
    const errorDetails = lastError?.message || "Gemini API failed to respond.";
    const fallbackMessage = `⚠️ **Gemini Connection Error**: Google Gemini could not complete the request.\n\n*Details:* \`${errorDetails}\`\n\n*Solution:* Please check your API key in Google AI Studio (https://aistudio.google.com) and ensure it has access to Gemini 1.5 Pro / Flash.`;

    return new Response(`0:${JSON.stringify(fallbackMessage)}\n`, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    });

  } catch (error: any) {
    console.error("Chat API Critical Error:", error);
    const fatalMessage = `⚠️ **System Error**: ${error?.message || "An unexpected error occurred."}`;
    return new Response(`0:${JSON.stringify(fatalMessage)}\n`, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    });
  }
}
