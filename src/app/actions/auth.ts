"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
  try {
    const rawName = formData.get("name") as string;
    const rawEmail = formData.get("email") as string;
    const rawPassword = formData.get("password") as string;

    if (!rawName || !rawEmail || !rawPassword) {
      return { error: "All fields are required" };
    }

    const name = rawName.trim();
    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword.trim();

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters" };
    }

    const existing = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });
    if (existing) {
      return { error: "An account with this email already exists. Please Sign In." };
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { name, email, password: hashed },
    });

    return { success: true };
  } catch (err) {
    console.error("Registration error:", err);
    return { error: "Registration failed. Please try again." };
  }
}
