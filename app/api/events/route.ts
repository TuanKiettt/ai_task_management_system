import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const events = await prisma.event.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    })

    // Convert to match frontend interface
    const formattedEvents = events.map((event: any) => ({
      id: event.id,
      title: event.title,
      date: event.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: event.time || "",
      location: event.location || "",
      type: (event.type || "meeting") as "meeting" | "conference" | "workshop" | "social", // Add type for frontend compatibility
      attendees: event.attendees || 0, // Add attendees for frontend compatibility
    }))

    return NextResponse.json(formattedEvents, { status: 200 })
  } catch (error) {
    console.error("Get events error:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title, date, time, location, type, attendees } = await req.json()

    if (!userId || !title || !date) {
      return NextResponse.json({ error: "User ID, title, and date are required" }, { status: 400 })
    }

    const event = await prisma.event.create({
      data: {
        userId,
        title,
        date: new Date(date),
        time: time || null,
        location: location || null,
        // TODO: Add type and attendees fields when Prisma client is fixed
        // type: type || "meeting",
        // attendees: attendees ? parseInt(attendees) : null,
      },
    })

    // Convert to match frontend interface
    const formattedEvent = {
      id: event.id,
      title: event.title,
      date: event.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: event.time || "",
      location: event.location || "",
      type: (type || "meeting") as "meeting" | "conference" | "workshop" | "social", // Add type in response
      attendees: parseInt(attendees) || 0, // Add attendees in response
    }

    return NextResponse.json(formattedEvent, { status: 201 })
  } catch (error) {
    console.error("Create event error:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}
