import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// POST - Export report data
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, workspaceId, period, format = 'csv' } = body
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Build base where clause
    const baseWhereClause: any = { userId }
    if (workspaceId && workspaceId !== 'personal') {
      baseWhereClause.workspaceId = workspaceId
    } else if (workspaceId === 'personal') {
      baseWhereClause.workspaceId = null
    }

    // Get tasks data
    const tasks = await prisma.task.findMany({
      where: {
        ...baseWhereClause,
        createdAt: { gte: startDate }
      },
      include: {
        user: { select: { fullName: true } },
        workspace: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get analytics summary
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'done').length
    const urgentTasks = tasks.filter(t => t.priority === 'Urgent').length
    
    // Generate report data based on format
    if (format === 'csv') {
      const csvData = generateCSV(tasks, period)
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${period}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'json') {
      const jsonData = generateJSON(tasks, period, {
        totalTasks,
        completedTasks,
        urgentTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      })
      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="report-${period}-${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    } else {
      return NextResponse.json({ error: "Unsupported format" }, { status: 400 })
    }

  } catch (error) {
    console.error("Error exporting report:", error)
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    )
  }
}

function generateCSV(tasks: any[], period: string): string {
  const headers = [
    'Task ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Category',
    'User',
    'Workspace',
    'Created Date',
    'Updated Date',
    'Due Date'
  ]
  
  const csvRows = [headers.join(',')]
  
  for (const task of tasks) {
    const row = [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      `"${(task.description || '').replace(/"/g, '""')}"`,
      task.status,
      task.priority,
      task.category || 'Uncategorized',
      `"${task.user?.fullName || 'Unknown'}"`,
      `"${task.workspace?.name || 'Personal'}"`,
      task.createdAt.toISOString().split('T')[0],
      task.updatedAt.toISOString().split('T')[0],
      task.dueDate ? task.dueDate.toISOString().split('T')[0] : ''
    ]
    csvRows.push(row.join(','))
  }
  
  // Add summary at the end
  csvRows.push('')
  csvRows.push('SUMMARY')
  csvRows.push(`Period,${period}`)
  csvRows.push(`Total Tasks,${tasks.length}`)
  csvRows.push(`Completed Tasks,${tasks.filter(t => t.status === 'done').length}`)
  csvRows.push(`Urgent Tasks,${tasks.filter(t => t.priority === 'Urgent').length}`)
  csvRows.push(`Completion Rate,${tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%`)
  
  return csvRows.join('\n')
}

function generateJSON(tasks: any[], period: string, summary: any) {
  return {
    metadata: {
      reportType: 'Analytics Export',
      period,
      generatedAt: new Date().toISOString(),
      totalRecords: tasks.length
    },
    summary,
    tasks: tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      user: task.user?.fullName,
      workspace: task.workspace?.name || 'Personal',
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      dueDate: task.dueDate
    }))
  }
}
