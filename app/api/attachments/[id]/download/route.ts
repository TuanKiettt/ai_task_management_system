import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { readFile } from "fs/promises"
import { join } from "path"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Get attachment details
    const attachment = await prisma.attachment.findUnique({
      where: { id },
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

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
    }

    // Read file from disk
    const filePath = join(process.cwd(), 'uploads', attachment.filePath)
    
    try {
      const fileBuffer = await readFile(filePath)
      
      // Create response with appropriate headers
      const response = new NextResponse(fileBuffer)
      
      // Set content type
      response.headers.set('Content-Type', attachment.fileType)
      
      // Set content disposition for download
      response.headers.set(
        'Content-Disposition',
        `attachment; filename="${attachment.fileName}"`
      )
      
      // Set content length
      response.headers.set('Content-Length', attachment.fileSize.toString())
      
      return response
    } catch (fileError) {
      console.error("Failed to read file from disk:", fileError)
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 })
    }
  } catch (error) {
    console.error("Download attachment error:", error)
    return NextResponse.json({ error: "Failed to download attachment" }, { status: 500 })
  }
}
