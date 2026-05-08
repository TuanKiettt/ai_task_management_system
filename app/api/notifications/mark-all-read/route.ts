import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

/**
 * Mark all notifications as read for a user
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: userId,
        read: false
      },
      data: {
        read: true
      }
    })

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      message: `Marked ${result.count} notifications as read`
    })
    
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return NextResponse.json({ error: "Failed to mark all notifications as read" }, { status: 500 })
  }
}
