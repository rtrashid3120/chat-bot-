import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    const conversationId = resolvedParams.id;

    // Ensure the conversation belongs to the user
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
    });

    if (!conversation) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // If it already has a shareId, return it
    if (conversation.shareId) {
      return NextResponse.json({ shareId: conversation.shareId });
    }

    // Otherwise, generate a new short shareId
    const shareId = uuidv4().substring(0, 10);
    
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { shareId },
    });

    return NextResponse.json({ shareId });
  } catch (error) {
    console.error("[SHARE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
