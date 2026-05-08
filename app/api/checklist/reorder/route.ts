import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(req: NextRequest) {
  try {
    const { taskId, itemIds } = await req.json()

    if (!taskId || !itemIds || !Array.isArray(itemIds)) {
      return NextResponse.json({ 
        error: "Task ID and item IDs array are required" 
      }, { status: 400 })
    }

    // Update positions for all checklist items in a transaction
    const updatePromises = itemIds.map((itemId: string, index: number) =>
      prisma.checklistItem.update({
        where: { id: itemId },
        data: { position: index }
      })
    )

    await prisma.$transaction(updatePromises)

    return NextResponse.json({ message: "Checklist items reordered successfully" }, { status: 200 })
  } catch (error) {
    console.error("Reorder checklist items error:", error)
    return NextResponse.json({ error: "Failed to reorder checklist items" }, { status: 500 })
  }
}
