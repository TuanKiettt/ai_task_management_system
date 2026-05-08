import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const { title, category, duration, status, progress } = await req.json()

    const course = await prisma.course.update({
      where: { id: params.courseId },
      data: {
        title,
        category,
        duration,
        status,
        progress,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(course, { status: 200 })
  } catch (error) {
    console.error("Update course error:", error)
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    await prisma.course.delete({
      where: { id: params.courseId },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Delete course error:", error)
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 })
  }
}
