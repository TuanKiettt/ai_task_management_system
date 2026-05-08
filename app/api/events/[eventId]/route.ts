import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const { title, date, time, location, type, attendees } = await req.json()

    const event = await prisma.event.update({
      where: { id: params.eventId },
      data: {
        title: title !== undefined ? title : undefined,
        date: date !== undefined ? new Date(date) : undefined,
        time: time !== undefined ? time : undefined,
        location: location !== undefined ? location : undefined,
        type: type !== undefined ? type : undefined,
        attendees: attendees !== undefined ? parseInt(attendees) : undefined,
      },
    })

    // Convert to match frontend interface
    const formattedEvent = {
      id: event.id,
      title: event.title,
      date: event.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: event.time || "",
      location: event.location || "",
      type: (event.type || "meeting") as "meeting" | "conference" | "workshop" | "social",
      attendees: event.attendees || 0,
    }

    return NextResponse.json(formattedEvent, { status: 200 })
  } catch (error) {
    console.error("Update event error:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    await prisma.event.delete({
      where: { id: params.eventId },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Delete event error:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
