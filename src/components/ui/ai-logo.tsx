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

  const svgSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8",
    xl: "w-11 h-11",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center group shrink-0", className)}>
      {/* Apple Intelligence Style Multi-Spectrum Glow Aura */}
      <div className="absolute -inset-1 rounded-[30px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 opacity-70 blur-md transition-all group-hover:opacity-100 group-hover:blur-lg animate-pulse" />

      {/* Apple Silicon / Metallic Glassmorphic Container */}
      <div
        className={cn(
          "relative flex items-center justify-center bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-slate-950 text-white shadow-2xl ring-1 ring-white/20 backdrop-blur-xl transition-transform duration-300 group-hover:scale-105",
          containerSizes[size]
        )}
      >
        {/* Apple Inspired Metallic Symbol */}
        <svg
          className={cn("transition-transform duration-300 group-hover:rotate-6", svgSizes[size])}
          viewBox="0 0 170 170"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Sleek Apple-style Bitten Geometry Silhouette / Intelligence Orbit Wave */}
          <path
            d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.14-1.9-14.4-6.1-3.61-2.98-7.61-7.79-12-14.44-7.56-11.45-13.1-23.77-16.63-36.96-3.53-13.2-5.3-25.56-5.3-37.09 0-14.88 3.83-27.42 11.49-37.62 7.66-10.2 17.51-15.42 29.56-15.66 4.69 0 9.94 1.18 15.74 3.55 5.8 2.37 9.87 3.56 12.21 3.56 2.01 0 6.06-1.14 12.16-3.43 6.1-2.29 11.27-3.34 15.52-3.15 13.56.63 24.36 5.88 32.4 15.75-11.8 7.15-17.53 17.06-17.2 29.74.33 10.02 4.23 18.5 11.71 25.43 7.48 6.93 16.36 10.8 26.63 11.61-2.48 7.37-5.69 14.65-9.63 21.84zM119.22 31.07c0-7.39 2.65-14.38 7.96-20.97 5.3-6.59 11.96-10.1 19.97-10.53.11.9.17 1.83.17 2.79 0 7.38-2.73 14.54-8.19 21.48-5.46 6.94-12.12 10.6-19.98 10.98-.07-.87-.11-1.78-.11-2.75z"
            fill="url(#appleGrad)"
            filter="url(#glow)"
          />
        </svg>
      </div>
    </div>
  );
}
