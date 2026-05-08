import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET - Fetch scheduled reports
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const workspaceId = searchParams.get('workspaceId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // TODO: Fetch from database when you have the scheduledReports table
    // const reports = await prisma.scheduledReport.findMany({
    //   where: {
    //     userId,
    //     ...(workspaceId && { workspaceId })
    //   },
    //   orderBy: { createdAt: 'desc' }
    // })

    // For now, return sample data
    const reports = [
      {
        id: "1",
        name: "Weekly Analytics",
        description: "Weekly performance summary for the team",
        reportType: "analytics",
        frequency: "weekly",
        recipients: ["user1", "user2"],
        format: "pdf",
        nextRun: "2026-05-12T09:00:00Z",
        isActive: true,
        createdAt: "2026-05-05T10:00:00Z"
      },
      {
        id: "2", 
        name: "Monthly Team Report",
        description: "Monthly team performance metrics",
        reportType: "team",
        frequency: "monthly",
        recipients: ["user1", "user2", "user3"],
        format: "pdf",
        nextRun: "2026-06-01T09:00:00Z",
        isActive: true,
        createdAt: "2026-05-01T14:00:00Z"
      }
    ]

    return NextResponse.json({
      success: true,
      reports
    })

  } catch (error) {
    console.error("Error fetching scheduled reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch scheduled reports" },
      { status: 500 }
    )
  }
}

// POST - Create scheduled report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      name, 
      description, 
      reportType, 
      frequency, 
      recipients, 
      format, 
      userId, 
      workspaceId 
    } = body
    
    if (!userId || !name || !reportType) {
      return NextResponse.json({ error: "User ID, name, and report type are required" }, { status: 400 })
    }

    // Calculate next run time
    const calculateNextRun = (frequency: string): string => {
      const now = new Date()
      switch (frequency) {
        case "daily":
          now.setDate(now.getDate() + 1)
          now.setHours(9, 0, 0, 0)
          break
        case "weekly":
          now.setDate(now.getDate() + (7 - now.getDay() + 1) % 7)
          now.setHours(9, 0, 0, 0)
          break
        case "monthly":
          now.setMonth(now.getMonth() + 1, 1)
          now.setHours(9, 0, 0, 0)
          break
        case "quarterly":
          now.setMonth(now.getMonth() + 3, 1)
          now.setHours(9, 0, 0, 0)
          break
        default:
          now.setDate(now.getDate() + 1)
      }
      return now.toISOString()
    }

    const newReport = {
      id: Date.now().toString(),
      name,
      description: description || "",
      reportType,
      frequency: frequency || "weekly",
      recipients: recipients || [],
      format: format || "pdf",
      nextRun: calculateNextRun(frequency || "weekly"),
      isActive: true,
      userId,
      workspaceId: workspaceId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // TODO: Save to database when you have the scheduledReports table
    // await prisma.scheduledReport.create({
    //   data: newReport
    // })

    console.log("Scheduled report created:", newReport)

    return NextResponse.json({
      success: true,
      message: "Scheduled report created successfully",
      report: newReport
    })

  } catch (error) {
    console.error("Error creating scheduled report:", error)
    return NextResponse.json(
      { error: "Failed to create scheduled report" },
      { status: 500 }
    )
  }
}
