import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { getConversations, createConversation } from "@/app/actions/conversations";
import { Sidebar } from "@/components/chat/sidebar";
import { AILogo } from "@/components/ui/ai-logo";
import { PlusCircle } from "lucide-react";

export default async function ChatPage() {
  let session = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("Auth error in ChatPage:", e);
  }
  if (!session?.user) redirect("/login");

  const conversations = await getConversations();

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-background overflow-hidden">
      <Sidebar conversations={conversations} currentId={undefined} />
      <main className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-6 sm:p-8">
        <AILogo size="xl" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Promptly-AI</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Start a new conversation with Promptly-AI</p>
        </div>
        <form action={createConversation}>
          <button type="submit" className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-primary-foreground font-semibold px-6 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-brand-500/25 active:scale-95">
            <PlusCircle className="h-5 w-5" />
            New Chat
          </button>
        </form>
      </main>
    </div>
  );
}
