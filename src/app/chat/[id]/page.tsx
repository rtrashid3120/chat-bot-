import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getConversations } from "@/app/actions/conversations";
import { Sidebar } from "@/components/chat/sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";

type DBMessage = {
  id: string;
  role: string;
  content: string;
};

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const conversation = await prisma.conversation.findUnique({
    where: { id, userId: session.user.id },
  });

  if (!conversation) notFound();

  const dbMessages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });

  const conversations = await getConversations();

  const initialMessages: DBMessage[] = dbMessages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-background overflow-hidden">
      <Sidebar conversations={conversations} currentId={id} />
      <main className="flex-1 h-full overflow-hidden">
        <ChatInterface id={id} initialMessages={initialMessages} />
      </main>
    </div>
  );
}
