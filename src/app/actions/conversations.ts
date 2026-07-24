"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getConversations() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, isPinned: true, isArchived: true, updatedAt: true },
  });
}

export async function createConversation() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const conversation = await prisma.conversation.create({
    data: { userId: session.user.id, title: "New Chat" },
  });
  redirect(`/chat/${conversation.id}`);
}

export async function deleteConversation(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.conversation.delete({
    where: { id, userId: session.user.id },
  });
  revalidatePath("/chat");
  redirect("/chat");
}

export async function updateConversationTitle(id: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.conversation.update({
    where: { id, userId: session.user.id },
    data: { title },
  });
  revalidatePath("/chat");
}
