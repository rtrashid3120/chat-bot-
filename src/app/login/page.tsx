"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, UserPlus, CheckCircle2 } from "lucide-react";
import { AILogo } from "@/components/ui/ai-logo";

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
    <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
      {isRegistered && !error && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm text-center font-semibold flex items-center justify-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
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
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-secondary/80 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-secondary/80 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-600 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-border/80 w-full" />
            <span className="bg-card px-3 text-xs text-muted-foreground shrink-0 uppercase tracking-wider font-semibold">New User?</span>
            <div className="border-t border-border/80 w-full" />
          </div>

          <Link
            href="/register"
            className="w-full border border-brand-500/40 hover:border-brand-500/80 bg-brand-500/5 hover:bg-brand-500/10 text-brand-500 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 text-sm text-center"
          >
            <UserPlus className="h-4 w-4" />
            Create New Account
          </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <AILogo size="lg" className="mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Welcome to RashidBot</h1>
          <p className="text-muted-foreground mt-1 text-sm text-center">Sign in to your account or create a new one</p>
        </div>
        <Suspense fallback={<div className="h-64 rounded-2xl bg-card border border-border/80 animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
