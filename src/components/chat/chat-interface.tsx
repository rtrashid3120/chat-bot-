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
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-6 pb-20">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 pt-32 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
                <Bot className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">How can I help you today?</h2>
              <p className="text-muted-foreground max-w-sm">
                I&apos;m Gemini, a helpful AI assistant. Ask me anything!
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex w-full animate-fade-in gap-4 rounded-xl p-4 transition-colors",
                  m.role === "user" ? "bg-accent/50" : ""
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow",
                    m.role === "user"
                      ? "bg-background border-border"
                      : "bg-brand-500 text-white border-brand-600"
                  )}
                >
                  {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className="flex-1 space-y-2 overflow-hidden px-1 prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex w-full animate-fade-in gap-4 rounded-xl p-4">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-brand-500 text-white border-brand-600 shadow">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1 flex items-center px-1">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-brand-500/50 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-brand-500/50 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-brand-500/50 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:px-6 lg:px-8 bg-background/80 backdrop-blur-xl border-t border-border/50">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim() && !isLoading) return;
              handleSubmit(e);
            }}
            className="relative flex items-center shadow-elevated rounded-xl bg-background border border-border focus-within:border-brand-500/50 focus-within:ring-1 focus-within:ring-brand-500/50 transition-all"
          >
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Message Gemini..."
              className="min-h-12 w-full resize-none border-0 bg-transparent py-3 pl-4 pr-12 text-sm focus:outline-none"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {isLoading ? (
                <button
                  onClick={stop}
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive"
                >
                  <Square className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Gemini can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
