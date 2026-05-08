import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params
    const { userId, title, description, category, priority, status, estimatedTime, dueDate, completedAt } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // First, check if task exists and belongs to the user
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    if (existingTask.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized to update this task" }, { status: 403 })
    }

    // Build update data dynamically to handle fields that might not be in database
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (priority !== undefined) updateData.priority = priority
    if (status !== undefined) updateData.status = status
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    })

    return NextResponse.json(task, { status: 200 })
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // First, check if task exists and belongs to the user
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    if (existingTask.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized to delete this task" }, { status: 403 })
    }

    await prisma.task.delete({
      where: { id: taskId },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
