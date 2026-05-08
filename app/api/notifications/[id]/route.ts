import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

/**
 * Mark a notification as read
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    })

    return NextResponse.json({
      success: true,
      notification
    })
    
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 })
  }
}

/**
 * Delete a notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.notification.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully"
    })
    
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
  }
}
