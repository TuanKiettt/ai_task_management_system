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

    const comments = await prisma.comment.findMany({
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

    return NextResponse.json(comments, { status: 200 })
  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const commentData = await req.json()
    const { taskId, userId, content, mentions = [] } = commentData

    if (!taskId || !userId || !content) {
      return NextResponse.json({ error: "Task ID, user ID, and content are required" }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId,
        content,
        mentions: JSON.stringify(mentions),
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

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Create comment error:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
