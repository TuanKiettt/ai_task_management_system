import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const parentTaskId = searchParams.get('parentTaskId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    let whereClause: any = {}
    
    if (parentTaskId) {
      whereClause.parentTaskId = parentTaskId
    }

    const subtasks = await prisma.subtask.findMany({
      where: whereClause,
      orderBy: { position: "asc" }
    })

    return NextResponse.json(subtasks, { status: 200 })
  } catch (error) {
    console.error("Get subtasks error:", error)
    return NextResponse.json({ error: "Failed to fetch subtasks" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const subtaskData = await req.json()
    const { parentTaskId, title, position } = subtaskData

    if (!parentTaskId || !title) {
      return NextResponse.json({ 
        error: "Parent task ID and title are required" 
      }, { status: 400 })
    }

    const subtask = await prisma.subtask.create({
      data: {
        parentTaskId,
        title: title.trim(),
        position: position || 0,
      }
    })

    return NextResponse.json(subtask, { status: 201 })
  } catch (error) {
    console.error("Create subtask error:", error)
    return NextResponse.json({ error: "Failed to create subtask" }, { status: 500 })
  }
}
