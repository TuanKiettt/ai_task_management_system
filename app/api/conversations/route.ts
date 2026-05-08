import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { timestamp: "asc" }
        }
      },
      orderBy: { updatedAt: "desc" },
    })

    // Convert to match frontend interface
    const formattedConversations = conversations.map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messages: conv.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: msg.timestamp,
      })),
    }))

    return NextResponse.json(formattedConversations, { status: 200 })
  } catch (error) {
    console.error("Get conversations error:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title } = await req.json()

    if (!userId || !title) {
      return NextResponse.json({ error: "User ID and title are required" }, { status: 400 })
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title,
      },
    })

    // Convert to match frontend interface
    const formattedConversation = {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: [],
    }

    return NextResponse.json(formattedConversation, { status: 201 })
  } catch (error) {
    console.error("Create conversation error:", error)
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}
