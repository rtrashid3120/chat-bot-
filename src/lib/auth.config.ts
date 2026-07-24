import type { NextAuthConfig } from "next-auth";

if (process.env.VERCEL_URL && !process.env.AUTH_URL) {
  process.env.AUTH_URL = `https://${process.env.VERCEL_URL}`;
}

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
