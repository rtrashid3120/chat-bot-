"use client";

import Link from "next/link";
import { useState } from "react";
import { createConversation, deleteConversation } from "@/app/actions/conversations";
import { PlusCircle, MessageSquare, Trash2, LogOut, MoreVertical, Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { AILogo } from "@/components/ui/ai-logo";
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
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  async function handleDelete(id: string) {
    setDeleting(id);
    await deleteConversation(id);
    setDeleting(null);
  }

  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border w-64 shadow-2xl md:shadow-none">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AILogo size="sm" />
          <span className="font-extrabold text-lg tracking-tight text-foreground bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            Promptly-AI
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-3">
        <form action={createConversation}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-brand-500/25 active:scale-95 mb-3"
          >
            <PlusCircle className="h-4 w-4" />
            New Chat
          </button>
        </form>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-accent/50 border border-border rounded-lg pl-3 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 scrollbar-thin">
        {filteredConversations.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-10 px-4">
            {conversations.length === 0 ? "No conversations yet. Tap \"New Chat\" to start!" : "No chats match your search."}
          </p>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                "group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-all hover:bg-accent/80",
                currentId === conv.id && "bg-accent font-medium shadow-sm"
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-brand-500" />
              <Link
                href={`/chat/${conv.id}`}
                onClick={() => setIsOpen(false)}
                className="flex-1 truncate text-foreground"
              >
                {conv.title}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-lg opacity-80 md:opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background/80 hover:text-foreground">
                  <MoreVertical className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => handleDelete(conv.id)}
                    className="text-destructive focus:text-destructive cursor-pointer"
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

      <div className="p-4 border-t border-border mt-auto">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-xl px-3 py-2.5 transition-colors"
        >
          <LogOut className="h-4 w-4 text-destructive" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Top Mobile Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border w-full shrink-0">
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-foreground hover:bg-accent/80 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <AILogo size="sm" />
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Promptly-AI</span>
        </div>

        <form action={createConversation}>
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-all active:scale-95"
          >
            <PlusCircle className="h-5 w-5" />
          </button>
        </form>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-[100dvh] shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative z-10 w-64 h-full animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
