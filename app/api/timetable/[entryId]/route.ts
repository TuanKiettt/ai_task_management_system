import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const { entryId } = await params
    const { dayOfWeek, startTime, endTime, subject, location, color } = await req.json()

    const entry = await prisma.timetableEntry.update({
      where: { id: entryId },
      data: {
        dayOfWeek,
        startTime,
        endTime,
        subject,
        location,
        color,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(entry, { status: 200 })
  } catch (error) {
    console.error("Update timetable entry error:", error)
    return NextResponse.json({ error: "Failed to update timetable entry" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { entryId: string } }) {
  try {
    await prisma.timetableEntry.delete({
      where: { id: params.entryId },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Delete timetable entry error:", error)
    return NextResponse.json({ error: "Failed to delete timetable entry" }, { status: 500 })
  }
}
