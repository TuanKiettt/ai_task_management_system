import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { conversationId, role, content } = await req.json()

    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { error: "Conversation ID, role, and content are required" },
        { status: 400 },
      )
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
      },
    })

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // Convert to match frontend interface
    const formattedMessage = {
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      timestamp: message.timestamp,
    }

    return NextResponse.json(formattedMessage, { status: 201 })
  } catch (error) {
    console.error("Create message error:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: params.conversationId },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(messages, { status: 200 })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
