import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

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

    const attachments = await prisma.attachment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { uploadedAt: "desc" }
    })

    return NextResponse.json(attachments, { status: 200 })
  } catch (error) {
    console.error("Get attachments error:", error)
    return NextResponse.json({ error: "Failed to fetch attachments" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const taskId = formData.get('taskId') as string
    const userId = formData.get('userId') as string

    if (!file || !taskId || !userId) {
      return NextResponse.json({ 
        error: "File, task ID, and user ID are required" 
      }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File size exceeds 10MB limit" 
      }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${timestamp}_${randomString}.${fileExtension}`
    const filePath = join(uploadsDir, uniqueFileName)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save attachment record to database
    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: uniqueFileName, // Store only the relative path
      },
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

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error("Upload attachment error:", error)
    return NextResponse.json({ error: "Failed to upload attachment" }, { status: 500 })
  }
}
