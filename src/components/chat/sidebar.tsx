"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createConversation, deleteConversation } from "@/app/actions/conversations";
import { PlusCircle, MessageSquare, Trash2, Bot, LogOut, MoreVertical } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Conversation = {
  id: string;
  title: string;
  isPinned: boolean;
  isArchived: boolean;
  updatedAt: Date;
};

export function Sidebar({
  conversations,
  currentId,
}: {
  conversations: Conversation[];
  currentId?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    await deleteConversation(id);
    setDeleting(null);
  }

  return (
    <aside className="w-64 flex flex-col h-screen bg-card border-r border-border shrink-0">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
            <Bot className="h-5 w-5" />
          </div>
          <span className="font-bold text-foreground">GeminiChat</span>
        </div>
        <form action={createConversation}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-all active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            New Chat
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 px-4">
            No conversations yet. Start a new chat!
          </p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-accent",
                currentId === conv.id && "bg-accent"
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Link
                href={`/chat/${conv.id}`}
                className="flex-1 truncate text-foreground"
              >
                {conv.title}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-6 w-6 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-accent-foreground">
                  <MoreVertical className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => handleDelete(conv.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleting === conv.id ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg px-3 py-2 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
