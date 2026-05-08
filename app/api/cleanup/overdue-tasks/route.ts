import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

/**
 * Cleanup API endpoint for automatically deleting overdue tasks
 * This should be called by a cron job every hour
 * 
 * Logic: Delete tasks that are:
 * 1. Past their due date
 * 2. More than 24 hours past due date
 * 3. Not completed (status != 'done')
 */
export async function POST(request: NextRequest) {
  try {
    // Get API key from header for security
    const authHeader = request.headers.get('authorization')
    const expectedApiKey = process.env.CLEANUP_API_KEY || 'cleanup-key-123'
    
    if (authHeader !== `Bearer ${expectedApiKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🧹 Starting overdue task cleanup...')
    
    // Calculate cutoff time: now - 24 hours
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - 24)
    
    console.log(`📅 Deleting tasks due before: ${cutoffTime.toISOString()}`)
    
    // Find and delete overdue tasks
    const deletedTasks = await prisma.task.deleteMany({
      where: {
        dueDate: {
          lt: cutoffTime // Tasks due more than 24 hours ago
        },
        status: {
          not: 'done' // Only delete incomplete tasks
        }
      }
    })
    
    console.log(`🗑️  Deleted ${deletedTasks.count} overdue tasks`)
    
    // Create system notification if tasks were deleted
    if (deletedTasks.count > 0) {
      console.log(`📊 Cleanup Summary: ${deletedTasks.count} tasks removed from system`)
      
      // Get all users to notify about cleanup
      const users = await prisma.user.findMany({
        select: { id: true }
      })
      
      // Create system notification for all users
      await prisma.notification.createMany({
        data: users.map((user: any) => ({
          userId: user.id,
          title: "Task Cleanup Completed",
          message: `System automatically removed ${deletedTasks.count} overdue tasks that were more than 24 hours past their deadline.`,
          type: "info",
          category: "system",
          read: false
        }))
      })
      
      console.log(`📢 Sent cleanup notifications to ${users.length} users`)
    }
    
    return NextResponse.json({
      success: true,
      deletedCount: deletedTasks.count,
      cutoffTime: cutoffTime.toISOString(),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error during overdue task cleanup:', error)
    return NextResponse.json(
      { error: "Failed to cleanup overdue tasks" },
      { status: 500 }
    )
  }
}

/**
 * Manual trigger for testing (GET request)
 */
export async function GET(request: NextRequest) {
  try {
    // Get API key from header for security
    const authHeader = request.headers.get('authorization')
    const expectedApiKey = process.env.CLEANUP_API_KEY || 'cleanup-key-123'
    
    if (authHeader !== `Bearer ${expectedApiKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🔍 Manual overdue task cleanup triggered...')
    
    // Calculate cutoff time: now - 24 hours
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - 24)
    
    // First, show what would be deleted (dry run)
    const tasksToDelete = await prisma.task.findMany({
      where: {
        dueDate: {
          lt: cutoffTime
        },
        status: {
          not: 'done'
        }
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    })
    
    console.log(`📋 Found ${tasksToDelete.length} tasks eligible for deletion`)
    
    return NextResponse.json({
      success: true,
      eligibleCount: tasksToDelete.length,
      tasks: tasksToDelete,
      cutoffTime: cutoffTime.toISOString(),
      timestamp: new Date().toISOString(),
      message: "This is a dry run. Use POST to actually delete tasks."
    })
    
  } catch (error) {
    console.error('❌ Error during manual cleanup check:', error)
    return NextResponse.json(
      { error: "Failed to check overdue tasks" },
      { status: 500 }
    )
  }
}
