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

    const checklistItems = await prisma.checklistItem.findMany({
      where: whereClause,
      orderBy: { position: "asc" }
    })

    return NextResponse.json(checklistItems, { status: 200 })
  } catch (error) {
    console.error("Get checklist items error:", error)
    return NextResponse.json({ error: "Failed to fetch checklist items" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const checklistData = await req.json()
    const { taskId, title, position } = checklistData

    if (!taskId || !title) {
      return NextResponse.json({ 
        error: "Task ID and title are required" 
      }, { status: 400 })
    }

    const checklistItem = await prisma.checklistItem.create({
      data: {
        taskId,
        title: title.trim(),
        position: position || 0,
      }
    })

    return NextResponse.json(checklistItem, { status: 201 })
  } catch (error) {
    console.error("Create checklist item error:", error)
    return NextResponse.json({ error: "Failed to create checklist item" }, { status: 500 })
  }
}
