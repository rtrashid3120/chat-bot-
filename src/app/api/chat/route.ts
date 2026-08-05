import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { groq } from "@/lib/groq";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const PERSONA_PROMPTS: Record<string, string> = {
  "default": "You are Promptly-AI, a helpful, friendly, and concise AI assistant. Your creator and owner is Mohamed Rashid. If anyone asks who made you, who owns you, or who your creator is, you must proudly say that you were created by Mohamed Rashid.",
  "coding": "You are Promptly-AI, an expert programmer. Provide clean, robust, well-documented code. Explain your reasoning clearly. Your creator and owner is Mohamed Rashid. If asked, state that you were created by him.",
  "creative": "You are Promptly-AI, a creative and imaginative writer. Express ideas with flair, vivid language, and engaging tone. Your creator and owner is Mohamed Rashid. If asked, state that you were created by him."
};

// ── Direct Mistral streaming via fetch ──────────────────────────────────────
async function streamMistral(rawMessages: { role: string; content: string; [key: string]: unknown }[]) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY not set");

  const messages = rawMessages
    .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "system")
    .map((m) => ({ role: m.role, content: String(m.content) }));

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "open-mistral-7b",
      messages,
      stream: true,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mistral API error: ${res.status} ${err}`);
  }

  return res;
}

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
    const modelKey = selectedModel || "gemini-1.5-flash";
    const isMistral = modelKey === "open-mistral-7b";
    const isGemini = modelKey.startsWith("gemini");

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
          model: modelKey,
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

    // ── Fast Real-time Live Web Search Pre-flight ─────────────────────────────
    let searchContext = "";
    try {
      const userText = typeof lastMessage.content === "string" ? lastMessage.content : "";
      if (userText.trim()) {
        const { load } = await import("cheerio");
        const htmlRes = await fetch("https://html.duckduckgo.com/html/", {
          method: "POST",
          headers: { 
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/112.0" 
          },
          body: "q=" + encodeURIComponent(userText)
        });
        
        if (htmlRes.ok) {
          const htmlText = await htmlRes.text();
          const $ = load(htmlText);
          const results: string[] = [];
          
          $('.result__snippet').each((i, el) => {
            if (i < 4) {
              results.push("- " + $(el).text().trim());
            }
          });
          
          if (results.length > 0) {
            searchContext = `\n\n[Live Internet Search Context]:\n${results.join('\n')}\nUse the live context above if relevant to answer the user accurately.`;
          }
        }
      }
    } catch (e) {
      console.warn("Live web search pre-flight skipped:", e);
    }

    // Build system prompt
    const basePersona = PERSONA_PROMPTS[persona as string] || PERSONA_PROMPTS["default"];
    const systemPrompt = basePersona + searchContext;
    
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
      { role: "system", content: systemPrompt },
      ...formattedMessages
    ];

    // ── 1. MISTRAL PROVIDER ──────────────────────────────────────────────────
    if (isMistral) {
      const mistralRes = await streamMistral(messagesForModel);
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      let fullText = "";

      const stream = new ReadableStream({
        async start(controller) {
          const reader = mistralRes.body!.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

              for (const line of lines) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content ?? "";
                  if (content) {
                    fullText += content;
                    controller.enqueue(encoder.encode(`0:${JSON.stringify(content)}\n`));
                  }
                } catch {}
              }
            }
          } finally {
            reader.releaseLock();
          }

          if (id && fullText) {
            await prisma.message.create({
              data: {
                conversationId: id,
                role: "assistant",
                content: fullText,
                model: modelKey,
              },
            });
            await prisma.conversation.update({
              where: { id },
              data: { messageCount: { increment: 1 } },
            });
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Vercel-AI-Data-Stream": "v1",
        },
      });
    }

    // ── 2. GEMINI PROVIDER ───────────────────────────────────────────────────
    if (isGemini) {
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

      const google = createGoogleGenerativeAI({ apiKey: googleApiKey });
      const geminiModelToUse = modelKey === "gemini-1.5-pro" ? "gemini-1.5-pro" : "gemini-1.5-flash";

      const result = streamText({
        model: google(geminiModelToUse),
        messages: messagesForModel,
        onFinish: async ({ text, usage }) => {
          if (id && text) {
            await prisma.message.create({
              data: {
                conversationId: id,
                role: "assistant",
                content: text,
                model: geminiModelToUse,
                tokens: usage?.totalTokens || 0,
              },
            });
            await prisma.conversation.update({
              where: { id },
              data: { messageCount: { increment: 1 } },
            });
          }
        },
      });

      return result.toDataStreamResponse();
    }

    // ── 3. GROQ (LLAMA) PROVIDER ─────────────────────────────────────────────
    const groqModelToUse = imageBase64 ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile";
    const result = streamText({
      model: groq(groqModelToUse),
      messages: messagesForModel,
      onFinish: async ({ text, usage }) => {
        if (id && text) {
          await prisma.message.create({
            data: {
              conversationId: id,
              role: "assistant",
              content: text,
              model: groqModelToUse,
              tokens: usage?.totalTokens || 0,
            },
          });
          await prisma.conversation.update({
            where: { id },
            data: { messageCount: { increment: 1 } },
          });
        }
      },
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("Chat API Error:", error);
    const fatalMessage = `⚠️ **Error**: ${error?.message || "An unexpected error occurred."}`;
    return new Response(`0:${JSON.stringify(fatalMessage)}\n`, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    });
  }
}
