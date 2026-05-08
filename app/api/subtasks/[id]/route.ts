import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const updates = await req.json()

    const subtask = await prisma.subtask.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json(subtask, { status: 200 })
  } catch (error) {
    console.error("Update subtask error:", error)
    return NextResponse.json({ error: "Failed to update subtask" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    await prisma.subtask.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Subtask deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Delete subtask error:", error)
    return NextResponse.json({ error: "Failed to delete subtask" }, { status: 500 })
  }
}
