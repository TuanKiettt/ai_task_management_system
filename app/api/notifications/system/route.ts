import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

/**
 * Create system notifications for all users or specific users
 * This is used by background jobs to notify users about system events
 */
export async function POST(request: NextRequest) {
  try {
    const { title, message, type, category, userIds, sendToAll } = await request.json()
    
    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
    }

    let targetUserIds: string[] = []

    if (sendToAll) {
      // Get all users
      const users = await prisma.user.findMany({
        select: { id: true }
      })
      targetUserIds = users.map((u: any) => u.id)
    } else if (userIds && Array.isArray(userIds)) {
      targetUserIds = userIds
    } else {
      return NextResponse.json({ error: "Either sendToAll=true or userIds array is required" }, { status: 400 })
    }

    // Create notifications for all target users
    const notifications = await Promise.all(
      targetUserIds.map(userId =>
        prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type: type || 'info',
            category: category || 'system',
            read: false
          }
        })
      )
    )

    console.log(`📢 Created ${notifications.length} system notifications: "${title}"`)

    return NextResponse.json({
      success: true,
      created: notifications.length,
      notifications: notifications.map(n => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        category: n.category,
        read: n.read,
        timestamp: n.timestamp
      }))
    })
    
  } catch (error) {
    console.error("Error creating system notifications:", error)
    return NextResponse.json({ error: "Failed to create system notifications" }, { status: 500 })
  }
}

/**
 * Get system-wide notification statistics
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await prisma.notification.groupBy({
      by: ['type', 'category'],
      where: {
        category: 'system'
      },
      _count: {
        id: true
      }
    })

    const totalSystemNotifications = await prisma.notification.count({
      where: {
        category: 'system'
      }
    })

    const unreadSystemNotifications = await prisma.notification.count({
      where: {
        category: 'system',
        read: false
      }
    })

    return NextResponse.json({
      success: true,
      stats,
      total: totalSystemNotifications,
      unread: unreadSystemNotifications
    })
    
  } catch (error) {
    console.error("Error getting system notification stats:", error)
    return NextResponse.json({ error: "Failed to get system notification stats" }, { status: 500 })
  }
}
