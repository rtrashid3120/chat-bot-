"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, UserPlus, CheckCircle2 } from "lucide-react";
import { AILogo } from "@/components/ui/ai-logo";
import { FloatingGlassParticles } from "@/components/ui/floating-glass-particles";

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
    <div className="bg-white/70 dark:bg-black/50 backdrop-blur-3xl border border-white/30 dark:border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-violet-900/10 dark:shadow-black/40 space-y-6 relative overflow-hidden">
      {/* Subtle interior glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-cyan-500/5 pointer-events-none" />
      
      <div className="relative z-10 space-y-6">
        {isRegistered && !error && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm text-center font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Account created! Sign in with your new email & password.
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground/90 mb-1.5 ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-violet-500 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white dark:bg-neutral-900 border border-border/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all shadow-inner"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground/90 mb-1.5 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-cyan-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white dark:bg-neutral-900 border border-border/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-inner"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-[0_0_20px_-5px_rgba(124,58,237,0.4)] hover:shadow-[0_0_25px_-5px_rgba(8,145,178,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 mt-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Authenticating..." : "Sign in to Workspace"}
          </button>
        </form>

        <div className="relative flex items-center justify-center pt-2">
          <div className="border-t border-border/40 w-full" />
          <span className="bg-transparent px-3 text-[10px] text-muted-foreground shrink-0 uppercase tracking-widest font-bold">New User?</span>
          <div className="border-t border-border/40 w-full" />
        </div>

        <Link
          href="/register"
          className="w-full border border-border/50 hover:border-violet-500/30 bg-white/30 dark:bg-black/30 hover:bg-violet-500/5 text-foreground font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 text-sm text-center shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          Create New Account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10 overflow-hidden bg-transparent">
      {/* Dynamic 3D Background */}
      <FloatingGlassParticles />

      {/* Subtle ambient lighting orb behind the form */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/20 dark:bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/20 dark:bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none translate-x-[20%] translate-y-[20%]" />

      <motion.div 
        initial={{ opacity: 0, y: 40, filter: "blur(12px)", scale: 0.9 }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          >
            <AILogo size="lg" className="mb-6 drop-shadow-2xl" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent"
          >
            Promptly-AI
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mt-3 text-base font-medium max-w-[280px]"
          >
            Your intelligent workspace, ready for action.
          </motion.p>
        </div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Suspense fallback={<div className="h-64 rounded-3xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/10 animate-pulse" />}>
            <LoginForm />
          </Suspense>
        </motion.div>
      </motion.div>
    </div>
  );
}
