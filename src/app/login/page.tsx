"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, UserPlus, CheckCircle2 } from "lucide-react";
import { AILogo } from "@/components/ui/ai-logo";

import { motion } from "framer-motion";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const result = await signIn("credentials", {
      email: cleanEmail,
      password: cleanPassword,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/chat");
    }
  }

  return (
    <div className="bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      {isRegistered && !error && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 text-sm text-center font-semibold flex items-center justify-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
          Account created! Sign in with your new email & password.
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium">
          {error}
        </div>
      )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground/90 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/50 dark:bg-black/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all backdrop-blur-md shadow-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground/90 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/50 dark:bg-black/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all backdrop-blur-md shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 mt-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign in to Workspace"}
            </button>
          </form>

          <div className="relative flex items-center justify-center pt-2">
            <div className="border-t border-border/40 w-full" />
            <span className="bg-transparent px-3 text-xs text-muted-foreground shrink-0 uppercase tracking-wider font-semibold">New User?</span>
            <div className="border-t border-border/40 w-full" />
          </div>

          <Link
            href="/register"
            className="w-full border border-border hover:border-foreground/30 bg-transparent hover:bg-foreground/5 text-foreground font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 text-sm text-center shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Create New Account
          </Link>
    </div>
  );
}

export default function LoginPage() {
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
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Promptly-AI</h1>
          <p className="text-muted-foreground mt-2 text-base font-medium max-w-[280px]">Your intelligent workspace, ready for action.</p>
        </div>
        <Suspense fallback={<div className="h-64 rounded-3xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/10 animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
