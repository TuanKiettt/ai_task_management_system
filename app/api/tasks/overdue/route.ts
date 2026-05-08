import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

/**
 * Get tasks that are overdue and will be deleted within 24 hours
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Calculate times
    const now = new Date()
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    // Find tasks that will be deleted in the next 24 hours
    const tasksToBeDeleted = await prisma.task.findMany({
      where: {
        userId: userId,
        dueDate: {
          lt: twentyFourHoursFromNow // Tasks due in the next 24 hours
        },
        status: {
          not: 'done' // Only incomplete tasks
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        status: true,
        category: true,
        priority: true,
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })
    
    // Calculate hours until deletion for each task
    const tasksWithDeletionTime = tasksToBeDeleted.map((task: any) => {
      const dueDate = new Date(task.dueDate)
      const deletionTime = new Date(dueDate.getTime() + 24 * 60 * 60 * 1000)
      const hoursUntilDeletion = Math.max(0, Math.floor((deletionTime.getTime() - now.getTime()) / (1000 * 60 * 60)))
      
      return {
        ...task,
        deletionTime,
        hoursUntilDeletion,
        isOverdue: dueDate < now,
        deletionStatus: hoursUntilDeletion === 0 ? 'Will be deleted now' : 
                        hoursUntilDeletion <= 1 ? 'Will be deleted within 1 hour' :
                        hoursUntilDeletion <= 6 ? 'Will be deleted within 6 hours' :
                        `Will be deleted in ${hoursUntilDeletion} hours`
      }
    })
    
    return NextResponse.json({
      success: true,
      tasks: tasksWithDeletionTime,
      summary: {
        total: tasksWithDeletionTime.length,
        overdue: tasksWithDeletionTime.filter((t: any) => t.isOverdue).length,
        critical: tasksWithDeletionTime.filter((t: any) => t.hoursUntilDeletion <= 1).length
      }
    })
    
  } catch (error) {
    console.error("Error fetching overdue tasks:", error)
    return NextResponse.json({ error: "Failed to fetch overdue tasks" }, { status: 500 })
  }
}
