import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(req: NextRequest) {
  try {
    const { parentTaskId, subtaskIds } = await req.json()

    if (!parentTaskId || !subtaskIds || !Array.isArray(subtaskIds)) {
      return NextResponse.json({ 
        error: "Parent task ID and subtask IDs array are required" 
      }, { status: 400 })
    }

    // Update positions for all subtasks in a transaction
    const updatePromises = subtaskIds.map((subtaskId: string, index: number) =>
      prisma.subtask.update({
        where: { id: subtaskId },
        data: { position: index }
      })
    )

    await prisma.$transaction(updatePromises)

    return NextResponse.json({ message: "Subtasks reordered successfully" }, { status: 200 })
  } catch (error) {
    console.error("Reorder subtasks error:", error)
    return NextResponse.json({ error: "Failed to reorder subtasks" }, { status: 500 })
  }
}
