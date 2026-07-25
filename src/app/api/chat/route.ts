import { groq } from "@/lib/groq";
import { streamText } from "ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

// ── Direct Mistral streaming via fetch ──────────────────────────────────────
async function streamMistral(messages: { role: string; content: string }[]) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY not set");

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
    const { messages, id, model: selectedModel } = body;

    if (!messages || messages.length === 0) {
      return new Response("No messages provided", { status: 400 });
    }

    const isMistral = selectedModel === "open-mistral-7b";
    const modelKey = isMistral ? "open-mistral-7b" : DEFAULT_MODEL;
    const lastMessage = messages[messages.length - 1];
    const userId = session.user.id as string;

    // Save user message to DB
    if (id) {
      const conv = await prisma.conversation.findUnique({
        where: { id, userId },
        select: { title: true },
      });

      const isDefaultTitle = !conv || conv.title === "New Chat" || conv.title.trim() === "";
      const snippetTitle =
        lastMessage.content.length > 35
          ? `${lastMessage.content.slice(0, 35)}...`
          : lastMessage.content;

      await prisma.message.create({
        data: {
          conversationId: id,
          role: "user",
          content: lastMessage.content,
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

    // ── Mistral: direct fetch streaming ─────────────────────────────────────
    if (isMistral) {
      const mistralRes = await streamMistral(messages);

      // Collect the full text from SSE stream and save to DB when done
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
                    // Emit in Vercel AI SDK data stream format
                    controller.enqueue(encoder.encode(`0:${JSON.stringify(content)}\n`));
                  }
                } catch {}
              }
            }
          } finally {
            reader.releaseLock();
          }

          // Save assistant response to DB
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
      messages,
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
