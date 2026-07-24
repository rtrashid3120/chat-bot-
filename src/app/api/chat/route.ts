import { groq } from "@/lib/groq";
import { streamText } from "ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { messages, id } = body;

    if (!messages || messages.length === 0) {
      return new Response("No messages provided", { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const modelToUse = "llama-3.3-70b-versatile";
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
          model: modelToUse,
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

    const result = streamText({
      model: groq(modelToUse),
      messages,
      onFinish: async ({ text, usage }) => {
        if (id) {
          await prisma.message.create({
            data: {
              conversationId: id,
              role: "assistant",
              content: text,
              model: modelToUse,
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
              model: modelToUse,
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
