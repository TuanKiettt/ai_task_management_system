import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function DELETE(req: NextRequest, { params }: { params: { taskId: string, emoji: string } }) {
  try {
    const { taskId, emoji } = params
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Delete the reaction
    const deletedReaction = await prisma.reaction.deleteMany({
      where: {
        taskId,
        userId,
        emoji,
      }
    })

    if (deletedReaction.count === 0) {
      return NextResponse.json({ error: "Reaction not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Reaction removed successfully" }, { status: 200 })
  } catch (error) {
    console.error("Delete reaction error:", error)
    return NextResponse.json({ error: "Failed to remove reaction" }, { status: 500 })
  }
}
