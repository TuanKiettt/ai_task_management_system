import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const workspaceId = searchParams.get('workspaceId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Build where clause
    const whereClause: any = { userId }
    if (workspaceId === 'personal') {
      // Only get personal tasks (workspaceId is null)
      whereClause.workspaceId = null
    } else if (workspaceId) {
      // Get tasks for specific workspace
      whereClause.workspaceId = workspaceId
    }
    // If workspaceId is undefined, get all tasks (current behavior)

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    // Get counts with simple count queries for better performance
    const taskIds = tasks.map(task => task.id)
    
    const [commentCounts, attachmentCounts, subtaskCounts] = await Promise.all([
      // Get comment counts
      Promise.all(
        taskIds.map(async (taskId) => ({
          taskId,
          count: await prisma.comment.count({ where: { taskId } })
        }))
      ),
      // Get attachment counts  
      Promise.all(
        taskIds.map(async (taskId) => ({
          taskId,
          count: await prisma.attachment.count({ where: { taskId } })
        }))
      ),
      // Get subtask counts
      Promise.all(
        taskIds.map(async (taskId) => {
          const subtasks = await prisma.subtask.findMany({
            where: { parentTaskId: taskId },
            select: { completed: true }
          })
          return {
            taskId,
            total: subtasks.length,
            completed: subtasks.filter(st => st.completed).length
          }
        })
      )
    ])

    // Create lookup maps for O(1) access
    const commentCountMap = new Map(
      commentCounts.map(cc => [cc.taskId, cc.count])
    )
    const attachmentCountMap = new Map(
      attachmentCounts.map(ac => [ac.taskId, ac.count])
    )
    const subtaskMap = new Map(
      subtaskCounts.map(sc => [sc.taskId, { total: sc.total, completed: sc.completed }])
    )

    // Format tasks for Kanban board
    const formattedTasks = tasks.map(task => ({
      ...task,
      comments: commentCountMap.get(task.id) || 0,
      attachments: attachmentCountMap.get(task.id) || 0,
      subtasks: subtaskMap.get(task.id) || { total: 0, completed: 0 }
    }))

    return NextResponse.json(formattedTasks, { status: 200 })
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title, description, category, priority, status, estimatedTime, dueDate, workspaceId } = await req.json()

    if (!userId || !title) {
      return NextResponse.json({ error: "User ID and title are required" }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description,
        category: category || 'General',
        priority,
        status,
        estimatedTime,
        dueDate: dueDate ? new Date(dueDate) : null,
        workspaceId: workspaceId || null,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { taskId, updates } = await req.json()

    if (!taskId || !updates) {
      return NextResponse.json({ error: "Task ID and updates are required" }, { status: 400 })
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updates,
    })

    return NextResponse.json(task, { status: 200 })
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}
