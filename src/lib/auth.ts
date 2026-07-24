import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET || "fallback_secret_for_build_only",
  debug: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const normalizedEmail = (credentials.email as string).trim().toLowerCase();
        const rawPassword = (credentials.password as string).trim();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (!user || !user.password) return null;
        const isValid = await bcrypt.compare(rawPassword, user.password);
        if (!isValid) return null;
        return user;
      },
    }),
  ],
});
