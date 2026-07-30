"use client";

import Link from "next/link";
import { AILogo } from "@/components/ui/ai-logo";
import { AbstractGlassHero } from "@/components/ui/abstract-glass-hero";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    if (containerRef.current) {
      const cards = gsap.utils.toArray(".feature-card") as HTMLElement[];
      
      cards.forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, y: 50 },
          {
            opacity: 1, 
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });
    }
  }, []);

  return (
    <main ref={containerRef} className="min-h-[200vh] w-full bg-transparent relative z-10 selection:bg-foreground selection:text-background">
      {/* 3D Hero */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <AbstractGlassHero />
        
        <div className="relative z-20 text-center px-4 mt-[-10vh]">
          <AILogo size="xl" className="mx-auto mb-8 drop-shadow-2xl opacity-0 animate-fade-in [animation-delay:0.2s]" />
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-foreground mb-6 opacity-0 animate-fade-in [animation-delay:0.4s]">
            The intelligent workspace.
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 font-medium opacity-0 animate-fade-in [animation-delay:0.6s]">
            Experience the next generation of AI chat. Designed for speed, engineered for power, crafted for absolute beauty.
          </p>
          <div className="flex gap-4 justify-center opacity-0 animate-fade-in [animation-delay:0.8s]">
            <Link
              href="/login"
              className="bg-foreground text-background font-bold px-10 py-5 rounded-full hover:opacity-90 transition-all shadow-2xl hover:shadow-3xl hover:-translate-y-1 active:translate-y-0 text-lg flex items-center gap-2"
            >
              Start Chatting
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>
      </section>
      
      {/* GSAP Scroll Sections */}
      <section className="relative min-h-screen py-32 px-4 flex flex-col items-center bg-gradient-to-b from-transparent to-black/5 dark:to-white/5">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-center max-w-3xl mb-24 mt-12">
          Everything you need to work faster and smarter.
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full">
          {[
            { title: "Blazing Fast", desc: "Built on Next.js 15 and React 19 for instant interactions." },
            { title: "Beautiful Design", desc: "Glassmorphism, fluid motion, and subtle 3D depth using WebGL." },
            { title: "Powerful AI", desc: "Powered by the latest large language models running locally or remote." },
            { title: "Privacy First", desc: "Your data stays yours. Built with a highly secure architecture." }
          ].map((feature, i) => (
            <div key={i} className="feature-card bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/20 dark:border-white/10 p-10 rounded-[32px] shadow-2xl hover:bg-white/60 dark:hover:bg-black/60 transition-colors">
              <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
