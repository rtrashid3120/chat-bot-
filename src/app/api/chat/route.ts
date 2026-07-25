import { groq } from "@/lib/groq";
import { streamText, generateText } from "ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

const PERSONA_PROMPTS: Record<string, string> = {
  "default": "You are RashidBot, a helpful, friendly, and concise AI assistant. Your creator and owner is Mohamed Rashid. If anyone asks who made you, who owns you, or who your creator is, you must proudly say that you were created by Mohamed Rashid.",
  "coding": "You are RashidBot, an expert programmer. Provide clean, robust, well-documented code. Explain your reasoning clearly. Your creator and owner is Mohamed Rashid. If asked, state that you were created by him.",
  "creative": "You are RashidBot, a creative and imaginative writer. Express ideas with flair, vivid language, and engaging tone. Your creator and owner is Mohamed Rashid. If asked, state that you were created by him."
};

// ── Direct Mistral streaming via fetch ──────────────────────────────────────
async function streamMistral(rawMessages: { role: string; content: string; [key: string]: unknown }[]) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY not set");

  // Mistral only accepts role + content — strip any extra AI SDK fields
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

    let isMistral = selectedModel === "open-mistral-7b";
    let modelKey = isMistral ? "open-mistral-7b" : DEFAULT_MODEL;
    
    // Automatically switch to Vision model if an image is uploaded
    if (imageBase64) {
      modelKey = "llama-3.2-90b-vision-preview";
      isMistral = false; // Must use Groq for vision
    }
    const lastMessage = messages[messages.length - 1];
    const userId = session.user.id as string;

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

    // ── Web Search Pre-flight (using fast Llama 8b) ──────────────────────────
    let searchContext = "";
    try {
      const searchDecision = await generateText({
        model: groq("llama-3.1-8b-instant"),
        messages: [
          { 
            role: "system", 
            content: "You are a search intent classifier. If the user's latest message requires searching the web for real-time information, news, current events, or facts you might not know, output a 1-6 word search query. Otherwise, output EXACTLY the word 'NO_SEARCH'. Reply with nothing else." 
          },
          ...messages.slice(-3).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }))
        ]
      });
      
      const searchIntent = searchDecision.text.trim();
      
      if (searchIntent && searchIntent !== "NO_SEARCH" && !searchIntent.includes("NO_SEARCH")) {
        console.log(`Web search intent detected: "${searchIntent}"`);
        
        const { load } = await import("cheerio");
        const htmlRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchIntent)}`, {
          headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" 
          }
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
            const topResults = results.join('\n');
            searchContext = `\n\nLive Web Search Results for "${searchIntent}":\n${topResults}\nUse this live context to inform your answer.`;
          }
        }
      }
    } catch (e) {
      console.error("Web search pre-flight failed (gracefully bypassing):", e);
    }

    // ── Inject Persona and Search Context ─────────────────────────────────────
    const basePersona = PERSONA_PROMPTS[persona as string] || PERSONA_PROMPTS["default"];
    const systemPrompt = basePersona + searchContext;
    
    // Process messages for Multimodal (Vision) if image is present
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

    // ── Mistral: direct fetch streaming ─────────────────────────────────────
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

    // ── Groq (Llama) via AI SDK streamText ──────────────────────────────────
    const result = streamText({
      model: groq(DEFAULT_MODEL),
      messages: messagesForModel,
      onFinish: async ({ text, usage }) => {
        if (id) {
          await prisma.message.create({
            data: {
              conversationId: id,
              role: "assistant",
              content: text,
              model: modelKey,
              tokens: usage.totalTokens,
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
              model: modelKey,
              inputTokens: usage.promptTokens || 0,
              outputTokens: usage.completionTokens || 0,
              totalTokens: usage.totalTokens || 0,
              cost: 0,
            },
          });
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred during chat processing" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
