import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        read: false
      }
    })

    // Convert to match frontend interface
    const formattedNotifications = notifications.map((notif: any) => ({
      ...notif,
      createdAt: notif.timestamp,
      timestamp: notif.timestamp.getTime(),
      category: notif.category || "system", // Add category for frontend compatibility
    }))

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      unreadCount,
      total: formattedNotifications.length
    }, { status: 200 })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title, message, type, category, actionUrl } = await req.json()

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "User ID, title, and message are required" }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || "info",
        // TODO: Add category and actionUrl fields when Prisma client is fixed
        // category: category || "system",
        // actionUrl: actionUrl || null,
      },
    })

    // Convert to match frontend interface
    const formattedNotification = {
      ...notification,
      createdAt: notification.timestamp,
      timestamp: notification.timestamp.getTime(),
      category: category || "system", // Add category in response
    }

    return NextResponse.json(formattedNotification, { status: 201 })
  } catch (error) {
    console.error("Create notification error:", error)
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}
