"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Send, Square, User, Mic, MicOff, ChevronDown, Download, Volume2, Settings2, Copy, Paperclip, X, VolumeX, Share2, Wand2, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AILogo } from "@/components/ui/ai-logo";
import { CodeBlock } from "@/components/chat/code-block";

const MODELS = [
  { key: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", badge: "Free", icon: "⚡" },
  { key: "open-mistral-7b",          label: "Mistral 7B",     badge: "Free", icon: "🌟" },
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

const PERSONAS = [
  { key: "default", label: "Default Assistant", description: "Helpful and concise" },
  { key: "coding", label: "Coding Expert", description: "Focuses on clean, robust code" },
  { key: "creative", label: "Creative Writer", description: "Imaginative and expressive" },
];

export function ChatInterface({ id, initialMessages = [] }: ChatInterfaceProps) {
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [selectedPersona, setSelectedPersona] = useState("default");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [walkieMode, setWalkieMode] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const personaRef = useRef<HTMLDivElement>(null);
  const lastSpokenId = useRef<string | null>(null);
  const walkieSubmitRequestedRef = useRef(false);

  const { messages, input, setInput, handleInputChange, handleSubmit: chatSubmit, status, stop } = useChat({
    id,
    initialMessages: initialMessages as import("@ai-sdk/react").Message[],
    body: { id },
  });

  const isLoading = status === "submitted" || status === "streaming";
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-speak logic
  useEffect(() => {
    if (autoSpeak && !isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && lastSpokenId.current !== lastMessage.id) {
        speak(lastMessage.content);
        lastSpokenId.current = lastMessage.id;
      }
    }
  }, [messages, isLoading, autoSpeak]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setPersonaDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const exportChat = () => {
    if (messages.length === 0) return;
    const content = messages.map(m => `### ${m.role === 'user' ? 'You' : 'Promptly-AI'}\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Promptly-AI-Chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      walkieSubmitRequestedRef.current = false; // Reset on manual stop
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
    recognition.onend = () => {
      setIsListening(false);
      if (walkieSubmitRequestedRef.current) {
        walkieSubmitRequestedRef.current = false;
        setTimeout(() => document.getElementById("hidden-submit-btn")?.click(), 100);
      }
    };
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    
    // Clear input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleShare = async () => {
    try {
      const res = await fetch(`/api/chat/${id}/share`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to share");
      const data = await res.json();
      const shareUrl = `${window.location.origin}/share/${data.shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      alert("✅ Public share link copied to clipboard!\n\n" + shareUrl);
    } catch (e) {
      alert("Failed to generate share link.");
    }
  };

  const improvePrompt = async () => {
    if (!input.trim() || isImproving) return;
    setIsImproving(true);
    try {
      const res = await fetch("/api/improve-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input })
      });
      if (!res.ok) throw new Error("Failed to improve prompt");
      const data = await res.json();
      if (data.improvedPrompt) {
        // Use setInput if available, fallback to event simulation
        if (typeof setInput === 'function') {
          setInput(data.improvedPrompt);
        } else {
          handleInputChange({ target: { value: data.improvedPrompt } } as any);
        }
      }
    } catch (e) {
      alert("Failed to improve prompt.");
    } finally {
      setIsImproving(false);
    }
  };

  const currentModel = MODELS.find((m) => m.key === selectedModel) ?? MODELS[0];
  const currentPersona = PERSONAS.find((p) => p.key === selectedPersona) ?? PERSONAS[0];

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-hidden relative">
      {/* Background ambient glowing shapes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Top Action Bar */}
      <div className="relative z-20 flex items-center justify-between pt-3 pb-1 px-4 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2">
          {/* Model Selector */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => { setModelDropdownOpen((v) => !v); setPersonaDropdownOpen(false); }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-card border border-border/70 hover:border-brand-500/50 text-sm font-medium text-foreground transition-all shadow-sm hover:shadow-brand-500/10 hover:shadow-md group"
            >
              <span className="text-base leading-none">{currentModel.icon}</span>
              <span className="hidden sm:inline text-foreground/90">{currentModel.label}</span>
              <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-md bg-brand-500/15 text-brand-400 font-semibold">
                {currentModel.badge}
              </span>
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", modelDropdownOpen && "rotate-180")} />
            </button>

            {modelDropdownOpen && (
              <div className="absolute top-full mt-2 left-0 w-56 rounded-2xl bg-card border border-border/80 shadow-2xl shadow-black/40 overflow-hidden z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-border/60">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Select Model</p>
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
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Persona Selector */}
          <div ref={personaRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => { setPersonaDropdownOpen((v) => !v); setModelDropdownOpen(false); }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-card border border-border/70 hover:border-brand-500/50 text-sm font-medium text-foreground transition-all shadow-sm hover:shadow-brand-500/10 hover:shadow-md group"
            >
              <Settings2 className="h-4 w-4 text-brand-500" />
              <span className="text-foreground/90">{currentPersona.label}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", personaDropdownOpen && "rotate-180")} />
            </button>

            {personaDropdownOpen && (
              <div className="absolute top-full mt-2 left-0 w-64 rounded-2xl bg-card border border-border/80 shadow-2xl shadow-black/40 overflow-hidden z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-border/60">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Bot Persona</p>
                </div>
                {PERSONAS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => { setSelectedPersona(p.key); setPersonaDropdownOpen(false); }}
                    className={cn(
                      "w-full flex flex-col px-4 py-2 text-sm transition-colors text-left",
                      selectedPersona === p.key
                        ? "bg-brand-500/15 text-brand-400"
                        : "text-foreground hover:bg-accent/60"
                    )}
                  >
                    <span className="font-medium">{p.label}</span>
                    <span className="text-xs opacity-70">{p.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Walkie-Talkie Toggle */}
          <button
            onClick={() => setWalkieMode(!walkieMode)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all shadow-sm",
              walkieMode 
                ? "bg-rose-500/15 border-rose-500/30 text-rose-500" 
                : "bg-card border-border/70 text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
            title="Toggle Walkie-Talkie Mode"
          >
            <Radio className="h-4 w-4" />
            <span className="hidden sm:inline">Walkie</span>
          </button>

          {/* Auto-Speak Toggle */}
          <button
            onClick={() => {
              setAutoSpeak(!autoSpeak);
              if (autoSpeak && 'speechSynthesis' in window) window.speechSynthesis.cancel();
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all shadow-sm",
              autoSpeak 
                ? "bg-brand-500/15 border-brand-500/30 text-brand-500" 
                : "bg-card border-border/70 text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
            title={autoSpeak ? "Auto-Speak is ON" : "Auto-Speak is OFF"}
          >
            {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">Auto-Speak</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/70 hover:bg-accent hover:text-foreground text-sm font-medium text-muted-foreground transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Share Public Link"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Export Button */}
          <button
            onClick={exportChat}
            disabled={messages.length === 0}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/70 hover:bg-accent hover:text-foreground text-sm font-medium text-muted-foreground transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export Chat to Markdown"
          >
            <Download className="h-4 w-4" />
            <span className="hidden lg:inline">Export</span>
          </button>
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
                I&apos;m Promptly-AI, your personal AI assistant. Ask me anything!
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
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code(props) {
                        const { children, className, node, ...rest } = props;
                        const match = /language-(\w+)/.exec(className || "");
                        return match ? (
                          <CodeBlock
                            language={match[1]}
                            value={String(children).replace(/\n$/, "")}
                          />
                        ) : (
                          <code {...rest} className={cn(className, "bg-muted/50 rounded-md px-1.5 py-0.5")}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
                {m.role === "assistant" && (
                  <div className="pt-1 flex items-center gap-1">
                    <button
                      onClick={() => speak(m.content)}
                      className="text-muted-foreground hover:text-brand-500 p-1.5 rounded-lg hover:bg-accent/50 transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(m.content);
                          // We could add a toast here, but simple copy is fine
                        }
                      }}
                      className="text-muted-foreground hover:text-brand-500 p-1.5 rounded-lg hover:bg-accent/50 transition-colors"
                      title="Copy message"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex w-full animate-fade-in gap-3 sm:gap-4 rounded-2xl p-4 bg-transparent">
              <div className="flex-1 flex items-center px-1">
                <AILogo size="md" className="animate-spin [animation-duration:3s] animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 sm:px-6 lg:px-8 bg-background/90 backdrop-blur-xl border-t border-border/60">
        <div className="mx-auto max-w-3xl">
          {/* Image Preview */}
          {imageBase64 && (
            <div className="mb-3 relative inline-block animate-fade-in">
              <div className="relative h-20 w-20 rounded-xl overflow-hidden border-2 border-brand-500/30 shadow-md">
                <img src={imageBase64} alt="Upload preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageBase64(null)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black p-1 rounded-full text-white backdrop-blur-md transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim() && !imageBase64 && !isLoading) return;
              chatSubmit(e, { body: { id, model: selectedModel, persona: selectedPersona, imageBase64 } });
              setImageBase64(null); // Clear after submit
            }}
            className="relative flex items-center shadow-lg rounded-2xl bg-card border border-border/80 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all"
          >
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            
            {walkieMode ? (
              <div className="flex w-full items-center justify-center py-2 px-4">
                <button
                  type="button"
                  onMouseDown={() => {
                    walkieSubmitRequestedRef.current = false;
                    if (!isListening) toggleListening();
                  }}
                  onMouseUp={() => {
                    if (isListening) {
                      walkieSubmitRequestedRef.current = true;
                      recognitionRef.current?.stop();
                    }
                  }}
                  onMouseLeave={() => {
                    if (isListening) {
                      recognitionRef.current?.stop();
                      setIsListening(false);
                      walkieSubmitRequestedRef.current = false;
                    }
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault(); 
                    walkieSubmitRequestedRef.current = false;
                    if (!isListening) toggleListening();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    if (isListening) {
                      walkieSubmitRequestedRef.current = true;
                      recognitionRef.current?.stop();
                    }
                  }}
                  className={cn(
                    "w-full max-w-sm mx-auto h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-white transition-all select-none touch-none",
                    isListening 
                      ? "bg-rose-500 scale-95 shadow-inner" 
                      : "bg-brand-500 shadow-md hover:bg-brand-600"
                  )}
                >
                  {isListening ? (
                    <>
                      <Mic className="h-5 w-5 animate-pulse" />
                      Listening... Release to Send
                    </>
                  ) : (
                    <>
                      <Radio className="h-5 w-5" />
                      Hold to Speak
                    </>
                  )}
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors"
                  title="Attach Image"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder={isListening ? "Listening... Speak now" : "Message Promptly-AI..."}
                  className="min-h-12 sm:min-h-14 w-full resize-none border-0 bg-transparent py-3 pl-12 pr-[120px] text-sm sm:text-base focus:outline-none placeholder:text-muted-foreground/70"
                />
              </>
            )}

            {!walkieMode && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={improvePrompt}
                  disabled={!input.trim() || isImproving}
                  title="Magic Prompt Improver"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                    isImproving
                      ? "text-brand-500 animate-pulse bg-brand-500/10"
                      : "text-muted-foreground hover:text-brand-500 hover:bg-brand-500/10 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                  )}
                >
                  <Wand2 className="h-4 w-4" />
                </button>
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
                  type="button"
                  onClick={() => stop()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent transition-colors"
                >
                  <Square className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() && !imageBase64}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:shadow-none"
                >
                  <Send className="h-4 w-4 ml-0.5" />
                </button>
              )}
            </div>
            )}
            <button id="hidden-submit-btn" type="submit" className="hidden" />
          </form>
          <p className="mt-2 text-center text-[11px] sm:text-xs text-muted-foreground/80">
            Promptly-AI can make mistakes. Verify important information. Created by Mohamed Rashid.
          </p>
        </div>
      </div>
    </div>
  );
}
