import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getConversations, createConversation } from "@/app/actions/conversations";
import { Sidebar } from "@/components/chat/sidebar";
import { PlusCircle, Bot } from "lucide-react";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const conversations = await getConversations();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar conversations={conversations} currentId={undefined} />
      <main className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
          <Bot className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">GeminiChat</h1>
          <p className="text-muted-foreground mt-2">Start a new conversation with Gemini AI</p>
        </div>
        <form action={createConversation}>
          <button type="submit" className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-brand-500/20 active:scale-95">
            <PlusCircle className="h-5 w-5" />
            New Chat
          </button>
        </form>
      </main>
    </div>
  );
}
