"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    throw new Error("All fields are required");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Email already registered");
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name, email, password: hashed },
  });

  redirect("/login?registered=true");
}
