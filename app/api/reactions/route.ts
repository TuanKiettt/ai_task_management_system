import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const taskId = searchParams.get('taskId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    let whereClause: any = {}
    
    if (taskId) {
      whereClause.taskId = taskId
    }

    const reactions = await prisma.reaction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(reactions, { status: 200 })
  } catch (error) {
    console.error("Get reactions error:", error)
    return NextResponse.json({ error: "Failed to fetch reactions" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const reactionData = await req.json()
    const { taskId, userId, emoji } = reactionData

    if (!taskId || !userId || !emoji) {
      return NextResponse.json({ 
        error: "Task ID, user ID, and emoji are required" 
      }, { status: 400 })
    }

    // Check if user already reacted with this emoji
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        taskId_userId_emoji: {
          taskId,
          userId,
          emoji
        }
      }
    })

    if (existingReaction) {
      return NextResponse.json({ 
        error: "User has already reacted with this emoji" 
      }, { status: 409 })
    }

    const reaction = await prisma.reaction.create({
      data: {
        taskId,
        userId,
        emoji,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json(reaction, { status: 201 })
  } catch (error) {
    console.error("Create reaction error:", error)
    return NextResponse.json({ error: "Failed to create reaction" }, { status: 500 })
  }
}
