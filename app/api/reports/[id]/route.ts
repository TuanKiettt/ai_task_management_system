import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// PUT update report
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, type, description, schedule, format, status } = body
    const { id } = params

    const report = await prisma.report.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(description && { description }),
        ...(schedule && { schedule }),
        ...(format && { format }),
        ...(status && { status }),
        ...(status === "generated" && { lastGenerated: new Date() })
      }
    })

    return NextResponse.json({
      success: true,
      report: {
        ...report,
        lastGenerated: report.lastGenerated?.toISOString() || null,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error("Error updating report:", error)
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    )
  }
}

// DELETE report
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    await prisma.report.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Report deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting report:", error)
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    )
  }
}
