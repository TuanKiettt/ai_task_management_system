import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const entries = await prisma.timetableEntry.findMany({
      where: { userId },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" }
      ],
    })

    return NextResponse.json(entries, { status: 200 })
  } catch (error) {
    console.error("Get timetable entries error:", error)
    return NextResponse.json({ error: "Failed to fetch timetable entries" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, dayOfWeek, startTime, endTime, subject, location, color } = await req.json()

    if (!userId || !dayOfWeek || !startTime || !endTime || !subject) {
      return NextResponse.json({ error: "User ID, day of week, start time, end time, and subject are required" }, { status: 400 })
    }

    const entry = await prisma.timetableEntry.create({
      data: {
        userId,
        dayOfWeek,
        startTime,
        endTime,
        subject,
        location,
        color,
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error("Create timetable entry error:", error)
    return NextResponse.json({ error: "Failed to create timetable entry" }, { status: 500 })
  }
}
