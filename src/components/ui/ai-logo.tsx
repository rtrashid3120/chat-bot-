"use client";

import { cn } from "@/lib/utils";

export function AILogo({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const containerSizes = {
    sm: "h-8 w-8 rounded-xl",
    md: "h-10 w-10 rounded-2xl",
    lg: "h-14 w-14 rounded-3xl",
    xl: "h-20 w-20 rounded-[28px]",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center group shrink-0", className)}>
      {/* Black and white moving animation aura */}
      <div className="absolute -inset-1 rounded-[30px] bg-gradient-to-tr from-zinc-200 via-zinc-400 to-zinc-200 dark:from-zinc-800 dark:via-zinc-600 dark:to-zinc-800 opacity-50 blur-md transition-all group-hover:opacity-100 group-hover:blur-lg animate-pulse" />

      {/* Glassmorphic Container */}
      <div
        className={cn(
          "relative flex items-center justify-center bg-white dark:bg-zinc-950 text-foreground shadow-xl ring-1 ring-border backdrop-blur-xl transition-transform duration-300 group-hover:scale-105 overflow-hidden",
          containerSizes[size]
        )}
      >
        <img 
          src="/logo.png" 
          alt="Promptly-AI Logo" 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:rotate-180 dark:invert"
        />
      </div>
    </div>
  );
}
