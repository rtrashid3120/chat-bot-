import type { NextAuthConfig } from "next-auth";

function getSanitizedUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const formatted = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    new URL(formatted);
    return formatted;
  } catch {
    return undefined;
  }
}

const safeUrl =
  getSanitizedUrl(process.env.AUTH_URL) ||
  getSanitizedUrl(process.env.NEXTAUTH_URL) ||
  getSanitizedUrl(process.env.VERCEL_URL) ||
  "http://localhost:3000";

process.env.AUTH_URL = safeUrl;
process.env.NEXTAUTH_URL = safeUrl;

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || "fallback_secret_for_build_only",
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
