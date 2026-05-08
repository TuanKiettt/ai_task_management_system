import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { unlink } from "fs/promises"
import { join } from "path"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Get attachment details to delete file from disk
    const attachment = await prisma.attachment.findUnique({
      where: { id }
    })

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
    }

    // Delete file from disk
    const filePath = join(process.cwd(), 'uploads', attachment.filePath)
    try {
      await unlink(filePath)
    } catch (fileError) {
      console.warn("Failed to delete file from disk:", fileError)
      // Continue with database deletion even if file deletion fails
    }

    // Delete attachment record from database
    await prisma.attachment.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Attachment deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Delete attachment error:", error)
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 })
  }
}
