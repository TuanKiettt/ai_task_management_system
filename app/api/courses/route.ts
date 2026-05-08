import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const courses = await prisma.course.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(courses, { status: 200 })
  } catch (error) {
    console.error("Get courses error:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title, category, duration, status, progress } = await req.json()

    if (!userId || !title || !category || !duration) {
      return NextResponse.json({ error: "User ID, title, category, and duration are required" }, { status: 400 })
    }

    const course = await prisma.course.create({
      data: {
        userId,
        title,
        category,
        duration,
        status: status || "assigned",
        progress: progress || 0,
      },
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error("Create course error:", error)
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 })
  }
}
