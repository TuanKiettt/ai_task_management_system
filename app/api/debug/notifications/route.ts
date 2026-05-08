import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

/**
 * Debug endpoint to check and create notifications for specific users
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (email) {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, fullName: true, email: true }
      })
      
      if (!user) {
        return NextResponse.json({ error: `User with email ${email} not found` }, { status: 404 })
      }
      
      // Get user's notifications
      const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: 'desc' },
        take: 10
      })
      
      return NextResponse.json({
        user,
        notifications: notifications.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          category: n.category,
          read: n.read,
          timestamp: n.timestamp
        })),
        total: notifications.length
      })
    }
    
    // Get all users and their notification counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        _count: {
          select: {
            notifications: true
          }
        }
      },
      orderBy: {
        notifications: {
          _count: 'desc'
        }
      }
    })
    
    return NextResponse.json({
      users: users.map((u: any) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        notificationCount: u._count.notifications
      }))
    })
    
  } catch (error) {
    console.error("Debug notifications error:", error)
    return NextResponse.json({ error: "Failed to debug notifications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, title, message, type, category } = await request.json()
    
    if (!email || !title || !message) {
      return NextResponse.json({ error: "Email, title, and message are required" }, { status: 400 })
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: `User with email ${email} not found` }, { status: 404 })
    }
    
    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        title,
        message,
        type: type || 'info',
        category: category || 'system',
        read: false
      }
    })
    
    console.log(`📝 Created notification for ${email}: "${title}"`)
    
    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        category: notification.category,
        read: notification.read,
        timestamp: notification.timestamp
      }
    })
    
  } catch (error) {
    console.error("Error creating debug notification:", error)
    return NextResponse.json({ error: "Failed to create debug notification" }, { status: 500 })
  }
}
