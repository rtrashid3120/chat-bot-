"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { registerUser } from "@/app/actions/auth";
import { AILogo } from "@/components/ui/ai-logo";

import { motion } from "framer-motion";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      const res = await registerUser(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        router.push("/login?registered=true");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <AILogo size="lg" className="mb-6 drop-shadow-xl" />
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Create account</h1>
          <p className="text-muted-foreground mt-2 text-base font-medium max-w-[280px]">Join the Promptly-AI workspace today</p>
        </div>
        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground/90 mb-1.5">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input name="name" type="text" required className="w-full bg-white/50 dark:bg-black/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all backdrop-blur-md shadow-sm" placeholder="Your name" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground/90 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input name="email" type="email" required className="w-full bg-white/50 dark:bg-black/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all backdrop-blur-md shadow-sm" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground/90 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input name="password" type="password" required minLength={8} className="w-full bg-white/50 dark:bg-black/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all backdrop-blur-md shadow-sm" placeholder="Min 8 characters" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-foreground text-background font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 mt-4">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Creating account..." : "Join Workspace"}
            </button>
          </form>
          
          <div className="relative flex items-center justify-center mt-6 pt-2">
            <div className="border-t border-border/40 w-full" />
            <span className="bg-transparent px-3 text-xs text-muted-foreground shrink-0 uppercase tracking-wider font-semibold">OR</span>
            <div className="border-t border-border/40 w-full" />
          </div>
          
          <p className="mt-6 text-center text-sm font-semibold text-foreground/80">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground underline decoration-border hover:decoration-foreground underline-offset-4 transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
