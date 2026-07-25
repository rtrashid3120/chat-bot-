"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Send, Square, User, Mic, MicOff, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AILogo } from "@/components/ui/ai-logo";

const MODELS = [
  { key: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", badge: "Free",   icon: "⚡" },
  { key: "gpt-4o",                   label: "GPT-4o",         badge: "OpenAI", icon: "🤖" },
  { key: "gpt-4o-mini",              label: "GPT-4o Mini",    badge: "OpenAI", icon: "🤖" },
];

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
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, status, stop } = useChat({
    id,
    initialMessages: initialMessages as import("@ai-sdk/react").Message[],
    body: { id, model: selectedModel },
  });

  const isLoading = status === "submitted" || status === "streaming";
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please try Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        const text = transcript.trim();
        const corrected = text.charAt(0).toUpperCase() + text.slice(1);
        const newInput = input ? `${input} ${corrected}` : corrected;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleInputChange({ target: { value: newInput } } as any);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const currentModel = MODELS.find((m) => m.key === selectedModel) ?? MODELS[0];

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-hidden relative">
      {/* Background ambient glowing shapes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Model Selector Bar */}
      <div className="relative z-20 flex items-center justify-center pt-3 pb-1 px-4">
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setModelDropdownOpen((v) => !v)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-card border border-border/70 hover:border-brand-500/50 text-sm font-medium text-foreground transition-all shadow-sm hover:shadow-brand-500/10 hover:shadow-md group"
          >
            <span className="text-base leading-none">{currentModel.icon}</span>
            <span className="text-foreground/90">{currentModel.label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-brand-500/15 text-brand-400 font-semibold">
              {currentModel.badge}
            </span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", modelDropdownOpen && "rotate-180")} />
          </button>

          {modelDropdownOpen && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 rounded-2xl bg-card border border-border/80 shadow-2xl shadow-black/40 overflow-hidden z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-border/60">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Select AI Model</p>
              </div>
              {MODELS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => { setSelectedModel(m.key); setModelDropdownOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left",
                    selectedModel === m.key
                      ? "bg-brand-500/15 text-brand-400"
                      : "text-foreground hover:bg-accent/60"
                  )}
                >
                  <span className="text-base">{m.icon}</span>
                  <span className="flex-1 font-medium">{m.label}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md font-semibold",
                    m.badge === "OpenAI" ? "bg-emerald-500/15 text-emerald-400" : "bg-brand-500/15 text-brand-400"
                  )}>
                    {m.badge}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 lg:px-8 z-10" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-4 pb-12">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-5 pt-16 sm:pt-28 text-center px-4">
              <AILogo size="xl" />
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                How can I help you today?
              </h2>
              <p className="text-muted-foreground max-w-sm text-sm sm:text-base">
                I&apos;m RashidBot, your personal AI assistant. Ask me anything!
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex w-full animate-fade-in gap-3 sm:gap-4 rounded-2xl p-4 transition-all shadow-md backdrop-blur-md",
                  m.role === "user"
                    ? "bg-accent/70 ml-auto border border-border/50"
                    : "bg-card/90 border border-border/70"
                )}
              >
                <div className="shrink-0 pt-0.5">
                  {m.role === "user" ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary border border-border text-foreground shadow-sm">
                      <User className="h-5 w-5" />
                    </div>
                  ) : (
                    <AILogo size="sm" />
                  )}
                </div>
                <div className="flex-1 space-y-2 overflow-hidden px-1 prose prose-sm dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex w-full animate-fade-in gap-3 sm:gap-4 rounded-2xl p-4 bg-card/90 border border-border/70 shadow-md backdrop-blur-md">
              <AILogo size="sm" />
              <div className="flex-1 flex items-center px-1">
                <div className="flex gap-1.5 items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-ping [animation-delay:0.2s]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500 animate-ping [animation-delay:0.4s]" />
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
              placeholder={isListening ? "Listening... Speak now" : "Message RashidBot..."}
              className="min-h-12 sm:min-h-14 w-full resize-none border-0 bg-transparent py-3 pl-4 pr-24 text-sm sm:text-base focus:outline-none placeholder:text-muted-foreground/70"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Speak to type"}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                  isListening
                    ? "bg-destructive text-white animate-pulse shadow-lg ring-2 ring-destructive/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/80"
                )}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

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
