import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// PUT - Update scheduled report
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { 
      name, 
      description, 
      reportType, 
      frequency, 
      recipients, 
      format 
    } = body
    
    const reportId = params.id

    if (!name || !reportType) {
      return NextResponse.json({ error: "Name and report type are required" }, { status: 400 })
    }

    // Calculate next run time if frequency changed
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

    const updatedReport = {
      name,
      description: description || "",
      reportType,
      frequency: frequency || "weekly",
      recipients: recipients || [],
      format: format || "pdf",
      nextRun: calculateNextRun(frequency || "weekly"),
      updatedAt: new Date().toISOString()
    }

    // TODO: Update in database when you have the scheduledReports table
    // await prisma.scheduledReport.update({
    //   where: { id: reportId },
    //   data: updatedReport
    // })

    console.log("Scheduled report updated:", reportId, updatedReport)

    return NextResponse.json({
      success: true,
      message: "Scheduled report updated successfully",
      report: { id: reportId, ...updatedReport }
    })

  } catch (error) {
    console.error("Error updating scheduled report:", error)
    return NextResponse.json(
      { error: "Failed to update scheduled report" },
      { status: 500 }
    )
  }
}

// DELETE - Delete scheduled report
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reportId = params.id

    // TODO: Delete from database when you have the scheduledReports table
    // await prisma.scheduledReport.delete({
    //   where: { id: reportId }
    // })

    console.log("Scheduled report deleted:", reportId)

    return NextResponse.json({
      success: true,
      message: "Scheduled report deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting scheduled report:", error)
    return NextResponse.json(
      { error: "Failed to delete scheduled report" },
      { status: 500 }
    )
  }
}

// PATCH - Toggle scheduled report active status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reportId = params.id

    // TODO: Get current status from database and toggle it
    // const currentReport = await prisma.scheduledReport.findUnique({
    //   where: { id: reportId }
    // })
    
    // if (!currentReport) {
    //   return NextResponse.json({ error: "Report not found" }, { status: 404 })
    // }

    // await prisma.scheduledReport.update({
    //   where: { id: reportId },
    //   data: { isActive: !currentReport.isActive }
    // })

    // For now, just simulate toggle
    console.log("Scheduled report toggled:", reportId)

    return NextResponse.json({
      success: true,
      message: "Scheduled report status updated successfully"
    })

  } catch (error) {
    console.error("Error toggling scheduled report:", error)
    return NextResponse.json(
      { error: "Failed to toggle scheduled report" },
      { status: 500 }
    )
  }
}
