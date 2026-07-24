"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
      return { error: "All fields are required" };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters" };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Email is already registered" };
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
