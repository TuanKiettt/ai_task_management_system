import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const updates = await req.json()

    const checklistItem = await prisma.checklistItem.update({
      where: { id },
      data: updates
    })

    return NextResponse.json(checklistItem, { status: 200 })
  } catch (error) {
    console.error("Update checklist item error:", error)
    return NextResponse.json({ error: "Failed to update checklist item" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    await prisma.checklistItem.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Checklist item deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Delete checklist item error:", error)
    return NextResponse.json({ error: "Failed to delete checklist item" }, { status: 500 })
  }
}
