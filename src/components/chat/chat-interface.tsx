"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { Send, Square, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type DBMessage = {
  id: string;
  role: string;
  content: string;
};

type ChatInterfaceProps = {
  id?: string;
  initialMessages?: DBMessage[];
};

export function ChatInterface({ id, initialMessages = [] }: ChatInterfaceProps) {
  const { messages, input, handleInputChange, handleSubmit, status, stop } = useChat({
    id,
    initialMessages: initialMessages as import("@ai-sdk/react").Message[],
    body: { id },
  });

  const isLoading = status === "submitted" || status === "streaming";

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 lg:px-8" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-4 pb-12">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 pt-20 sm:pt-32 text-center px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/20 animate-bounce">
                <Bot className="h-7 w-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">How can I help you today?</h2>
              <p className="text-muted-foreground max-w-sm text-sm sm:text-base">
                I&apos;m RashidBot, your personal AI assistant. Ask me anything!
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex w-full animate-fade-in gap-3 sm:gap-4 rounded-2xl p-3.5 sm:p-4 transition-all shadow-sm",
                  m.role === "user"
                    ? "bg-accent/60 ml-auto border border-border/40"
                    : "bg-card border border-border/60"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl border shadow-sm",
                    m.role === "user"
                      ? "bg-background border-border text-foreground"
                      : "bg-gradient-to-br from-brand-500 to-brand-600 text-white border-brand-600"
                  )}
                >
                  {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className="flex-1 space-y-2 overflow-hidden px-1 prose prose-sm dark:prose-invert max-w-none text-sm sm:text-base">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex w-full animate-fade-in gap-3 sm:gap-4 rounded-2xl p-3.5 sm:p-4 bg-card border border-border/60 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white border border-brand-600 shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1 flex items-center px-1">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-500 animate-bounce" />
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 sm:px-6 lg:px-8 bg-background/90 backdrop-blur-xl border-t border-border/60">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim() && !isLoading) return;
              handleSubmit(e);
            }}
            className="relative flex items-center shadow-lg rounded-2xl bg-card border border-border/80 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all"
          >
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Message RashidBot..."
              className="min-h-12 sm:min-h-14 w-full resize-none border-0 bg-transparent py-3 pl-4 pr-12 text-sm sm:text-base focus:outline-none placeholder:text-muted-foreground/70"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {isLoading ? (
                <button
                  onClick={stop}
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Square className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-600 text-white shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
          <p className="mt-2 text-center text-[11px] sm:text-xs text-muted-foreground/80">
            RashidBot can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
