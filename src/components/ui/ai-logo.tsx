"use client";

import { Sparkles, Bot, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export function AILogo({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-7 w-7",
    xl: "h-10 w-10",
  };

  const badgeSizes = {
    sm: "h-2.5 w-2.5 -top-0.5 -right-0.5",
    md: "h-3.5 w-3.5 -top-1 -right-1",
    lg: "h-4 w-4 -top-1 -right-1",
    xl: "h-6 w-6 -top-1.5 -right-1.5",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center group", className)}>
      {/* Outer ambient glow ring */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 opacity-70 blur-md transition-all group-hover:opacity-100 group-hover:blur-lg animate-pulse" />

      {/* Main container */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white shadow-xl ring-1 ring-white/20 transition-all transform group-hover:scale-105",
          sizeClasses[size]
        )}
      >
        {/* Core Icon */}
        <Cpu className={cn("text-cyan-400 transition-transform group-hover:rotate-12", iconSizes[size])} />
        <Bot className={cn("absolute text-purple-300 opacity-90 transition-transform group-hover:scale-110", iconSizes[size])} />

        {/* Sparkle badge */}
        <div className={cn("absolute flex items-center justify-center rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 text-slate-950 font-bold ring-2 ring-slate-950 shadow-md animate-bounce", badgeSizes[size])}>
          <Sparkles className="h-full w-full p-0.5 fill-current" />
        </div>
      </div>
    </div>
  );
}
