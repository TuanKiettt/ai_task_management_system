import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

/**
 * Generate intelligent task reminders based on user behavior and deadlines
 * This should be called by a cron job every few hours
 * 
 * Logic:
 * 1. Find tasks that haven't been started (status = 'new')
 * 2. Check if user hasn't updated task recently
 * 3. Calculate urgency based on deadline proximity
 * 4. Generate appropriate notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Get API key from header for security
    const authHeader = request.headers.get('authorization')
    const expectedApiKey = process.env.CLEANUP_API_KEY || 'cleanup-key-123'
    
    if (authHeader !== `Bearer ${expectedApiKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('Starting intelligent task reminder generation...')
    
    const now = new Date()
    const notificationsCreated = []
    
    // Find all users with tasks that might need reminders
    const usersWithTasks = await prisma.task.findMany({
      where: {
        status: 'new', // Only tasks not started
        dueDate: {
          gte: now // Only future or current tasks
        }
      },
      select: {
        userId: true,
        id: true,
        title: true,
        dueDate: true,
        category: true,
        priority: true,
        updatedAt: true,
        createdAt: true,
        workspace: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    })
    
    // Group tasks by user
    const tasksByUser = usersWithTasks.reduce((acc: any, task: any) => {
      if (!acc[task.userId]) {
        acc[task.userId] = []
      }
      acc[task.userId].push(task)
      return acc
    }, {} as Record<string, any[]>)
    
    // Process each user's tasks
    for (const [userId, tasks] of Object.entries(tasksByUser)) {
      const userNotifications = await generateNotificationsForUser(userId, tasks as any[], now)
      notificationsCreated.push(...userNotifications)
    }
    
    console.log(`Generated ${notificationsCreated.length} task reminders`)
    
    return NextResponse.json({
      success: true,
      notificationsCreated: notificationsCreated.length,
      usersProcessed: Object.keys(tasksByUser).length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error generating task reminders:', error)
    return NextResponse.json(
      { error: "Failed to generate task reminders" },
      { status: 500 }
    )
  }
}

/**
 * Generate notifications for a specific user based on their tasks
 */
async function generateNotificationsForUser(userId: string, tasks: any[], now: Date) {
  const notifications = []
  
  for (const task of tasks) {
    const notification = await shouldCreateNotification(task, now)
    if (notification) {
      // Check if similar notification already exists in last 24 hours
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: userId,
          title: notification.title,
          message: notification.message,
          timestamp: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
      
      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId: userId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            category: 'task-reminder',
            actionUrl: notification.actionUrl
          }
        })
        
        notifications.push({
          taskId: task.id,
          taskTitle: task.title,
          notification: notification
        })
        
        console.log(`Created reminder for task "${task.title}" (User: ${task.user.fullName})`)
      }
    }
  }
  
  return notifications
}

/**
 * Determine if a notification should be created for a task
 */
async function shouldCreateNotification(task: any, now: Date) {
  const dueDate = new Date(task.dueDate)
  const createdAt = new Date(task.createdAt)
  const updatedAt = new Date(task.updatedAt)
  
  // Time calculations
  const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
  const hoursSinceUpdated = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)
  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  const daysUntilDue = hoursUntilDue / 24
  
  // Don't create notifications for tasks due in less than 2 hours
  if (hoursUntilDue < 2) {
    return null
  }
  
  // Notification logic based on different scenarios
  let notification = null
  
  // Scenario 1: Task created more than 2 days ago, never updated, due soon
  if (hoursSinceCreated >= 48 && hoursSinceUpdated >= 48 && daysUntilDue <= 7) {
    notification = {
      title: "Task Waiting to Start",
      message: `You created "${task.title}" ${Math.floor(hoursSinceCreated / 24)} days ago but haven't started yet. Due in ${Math.ceil(daysUntilDue)} days.`,
      type: "warning",
      actionUrl: task.workspace ? `/workspaces/${task.workspace.id}/tasks` : '/todo'
    }
  }
  
  // Scenario 2: High priority task not started, due within 3 days
  else if (task.priority === 'Urgent' || task.priority === 'High') {
    if (daysUntilDue <= 3 && hoursSinceUpdated >= 24) {
      notification = {
        title: "Urgent Task Needs Attention",
        message: `High priority task "${task.title}" is due in ${Math.ceil(daysUntilDue)} days and hasn't been started.`,
        type: "error",
        actionUrl: task.workspace ? `/workspaces/${task.workspace.id}/tasks` : '/todo'
      }
    }
  }
  
  // Scenario 3: Task due within 2 days, not updated in 24 hours
  else if (daysUntilDue <= 2 && hoursSinceUpdated >= 24) {
    notification = {
      title: "Deadline Approaching",
      message: `"${task.title}" is due in ${Math.ceil(daysUntilDue)} days. Time to get started!`,
      type: "warning",
      actionUrl: task.workspace ? `/workspaces/${task.workspace.id}/tasks` : '/todo'
    }
  }
  
  // Scenario 4: Task due within 5 days, not updated in 3 days
  else if (daysUntilDue <= 5 && hoursSinceUpdated >= 72) {
    notification = {
      title: "Task Reminder",
      message: `Don't forget about "${task.title}" due in ${Math.ceil(daysUntilDue)} days.`,
      type: "info",
      actionUrl: task.workspace ? `/workspaces/${task.workspace.id}/tasks` : '/todo'
    }
  }
  
  return notification
}

/**
 * Manual trigger for testing (GET request)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedApiKey = process.env.CLEANUP_API_KEY || 'cleanup-key-123'
    
    if (authHeader !== `Bearer ${expectedApiKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required for testing" }, { status: 400 })
    }

    console.log(`🔍 Testing task reminders for user: ${userId}`)
    
    const now = new Date()
    const tasks = await prisma.task.findMany({
      where: {
        userId: userId,
        status: 'new',
        dueDate: {
          gte: now
        }
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    })
    
    const potentialNotifications = []
    
    for (const task of tasks) {
      const notification = await shouldCreateNotification(task, now)
      if (notification) {
        potentialNotifications.push({
          task: {
            id: task.id,
            title: task.title,
            dueDate: task.dueDate,
            priority: task.priority,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
          },
          notification
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      userId,
      totalTasks: tasks.length,
      potentialNotifications: potentialNotifications.length,
      notifications: potentialNotifications
    })
    
  } catch (error) {
    console.error('Error testing task reminders:', error)
    return NextResponse.json(
      { error: "Failed to test task reminders" },
      { status: 500 }
    )
  }
}
