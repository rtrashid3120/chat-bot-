"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Send, Square, User, Mic, MicOff, ChevronDown, Download, Volume2, Settings2, Copy, Paperclip, X, VolumeX, Share2, Wand2, Radio, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AILogo } from "@/components/ui/ai-logo";
import { CodeBlock } from "@/components/chat/code-block";
import { InputBar } from "@/components/ui/input-bar";
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background";
import { motion } from "framer-motion";

const MODELS = [
  { key: "gemini-1.5-flash",        label: "Gemini 1.5 Flash", badge: "Web + Vision", icon: "✨" },
  { key: "gemini-1.5-pro",          label: "Gemini 1.5 Pro",   badge: "Pro Web",      icon: "🌟" },
  { key: "llama-3.3-70b-versatile", label: "Llama 3.3 70B",   badge: "Free",         icon: "⚡" },
  { key: "open-mistral-7b",         label: "Mistral 7B",       badge: "Free",         icon: "🔥" },
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
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");
  const [selectedPersona, setSelectedPersona] = useState("default");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [walkieMode, setWalkieMode] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const personaRef = useRef<HTMLDivElement>(null);
  const lastSpokenId = useRef<string | null>(null);
  const walkieSubmitRequestedRef = useRef(false);

  const { messages, input, setInput, handleInputChange, append, status, stop } = useChat({
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
        setTimeout(() => {
          // Use the latest input from the DOM or state
          const textarea = document.querySelector('textarea');
          const currentText = textarea?.value?.trim();
          if (currentText) {
            append(
              { role: "user", content: currentText }, 
              { body: { id, model: selectedModel, persona: selectedPersona, imageBase64 } }
            );
            setImageBase64(null);
            if (typeof setInput === 'function') setInput("");
            else handleInputChange({ target: { value: "" } } as any);
          }
        }, 300);
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

  // Extracting isDark for easy checks
  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex h-full w-full flex-col bg-transparent overflow-hidden relative">
      {/* Animated Gradient Background from 21st.dev - Tweaked for Dark Mode */}
      <AnimatedGradientBackground
        Breathing
        gradientColors={
          isDark 
            ? ["#000000", "#0a0a0a", "#111111", "#1a1a1a", "#222222", "#000000", "#050505"]
            : ["#ffffff", "#f8fafc", "#ede9fe", "#ddd6fe", "#c4b5fd", "#a78bfa", "#8b5cf6"]
        }
        gradientStops={[30, 45, 58, 68, 78, 88, 100]}
        animationSpeed={isDark ? 0.008 : 0.012}
        breathingRange={6}
        containerClassName={isDark ? "opacity-100" : "opacity-30"}
      />

      {/* Top Action Bar - Floating Pill Design */}
      <div className="relative z-20 flex flex-wrap md:flex-nowrap items-center justify-between gap-y-2 gap-x-1 pt-4 pb-1 px-4 max-w-4xl xl:max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 p-1.5 rounded-2xl shadow-lg">
          {/* Model Selector */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => { setModelDropdownOpen((v) => !v); setPersonaDropdownOpen(false); }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-sm font-semibold text-foreground transition-all group"
            >
              <span className="text-base leading-none">{currentModel.icon}</span>
              <span className="inline-block max-w-[70px] sm:max-w-none truncate text-foreground/90">{currentModel.label}</span>
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
          <div ref={personaRef} className="relative">
            <button
              type="button"
              onClick={() => { setPersonaDropdownOpen((v) => !v); setModelDropdownOpen(false); }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-card border border-border/70 hover:border-brand-500/50 text-sm font-medium text-foreground transition-all shadow-sm hover:shadow-brand-500/10 hover:shadow-md group"
            >
              <Settings2 className="h-4 w-4 text-brand-500 hidden sm:block" />
              <span className="inline-block max-w-[70px] sm:max-w-none truncate text-foreground/90">{currentPersona.label}</span>
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
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors group"
              title="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5 group-hover:-rotate-12 transition-transform" />
              )}
            </button>
          )}
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
        <div className="mx-auto max-w-4xl xl:max-w-5xl space-y-4 pb-12">
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
            messages.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.02, 0.2), ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "flex w-full gap-3 sm:gap-4 rounded-3xl p-4 sm:p-5 transition-all shadow-md",
                  m.role === "user"
                    ? "bg-neutral-100 dark:bg-zinc-800 border border-border/60 text-foreground ml-auto max-w-[85%] rounded-tr-sm"
                    : "bg-white dark:bg-zinc-900 border border-border/40 text-foreground rounded-tl-sm"
                )}
              >
                <div className="shrink-0 pt-1">
                  {m.role === "user" ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-neutral-700 border border-border/50 text-foreground shadow-sm">
                      <User className="h-5 w-5" />
                    </div>
                  ) : (
                    <AILogo size="sm" />
                  )}
                </div>
                <div className="flex-1 space-y-2 overflow-hidden px-1 prose prose-sm dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-foreground">
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
              </motion.div>
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
        <div className="mx-auto max-w-4xl xl:max-w-5xl">
          {/* Image preview above InputBar */}
          {imageBase64 && (
            <div className="mb-2 flex items-start gap-2 px-3">
              <div className="relative">
                <img src={imageBase64} alt="Attached" className="max-h-32 rounded-xl border border-border object-cover" />
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

          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {walkieMode ? (
            <div className="px-3 pb-3">
              <div className="mx-auto max-w-3xl">
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
                    "w-full h-14 rounded-[16px] flex items-center justify-center gap-2 font-bold text-white transition-all select-none touch-none shadow-sm ring-1",
                    isListening
                      ? "bg-rose-500 scale-95 shadow-inner ring-rose-400"
                      : "bg-neutral-900 dark:bg-white dark:text-neutral-900 ring-neutral-800 dark:ring-neutral-200 hover:opacity-90"
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
            </div>
          ) : (
            <InputBar
              value={input}
              onChange={(v) => handleInputChange({ target: { value: v } } as React.ChangeEvent<HTMLInputElement>)}
              onSend={(msg) => {
                append({ role: "user", content: msg.content }, { body: { id, model: selectedModel, persona: selectedPersona, imageBase64 } });
                setImageBase64(null);
              }}
              onStop={stop}
              status={isLoading ? "streaming" : "ready"}
              placeholder={isListening ? "Listening... Speak now" : "Message Promptly-AI..."}
              autoFocus
              onAttach={() => fileInputRef.current?.click()}
              leftActions={
                <button
                  type="button"
                  onClick={improvePrompt}
                  disabled={!input.trim() || isImproving}
                  title="Magic Prompt Improver"
                  className={cn(
                    "inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors",
                    isImproving
                      ? "text-violet-500 animate-pulse bg-violet-100 dark:bg-violet-900/30"
                      : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40"
                  )}
                >
                  <Wand2 className="h-4 w-4" />
                </button>
              }
              rightActions={
                <button
                  type="button"
                  onClick={toggleListening}
                  title={isListening ? "Stop listening" : "Speak to type"}
                  className={cn(
                    "inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors",
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              }
            />
          )}
          <p className="mt-1 pb-2 text-center text-[11px] sm:text-xs text-muted-foreground/60">
            Promptly-AI can make mistakes. Verify important information. Created by Mohamed Rashid.
          </p>
        </div>
      </div>
    </div>
  );
}
