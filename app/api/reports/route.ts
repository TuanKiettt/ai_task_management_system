import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET all reports for user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const reports = await prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({
      success: true,
      reports: reports.map((report: any) => ({
        ...report,
        lastGenerated: report.lastGenerated?.toISOString() || null,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString()
      }))
    })
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    )
  }
}

// POST create new report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, description, schedule, format, userId } = body

    if (!name || !type || !description || !schedule || !format || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const report = await prisma.report.create({
      data: {
        name,
        type,
        description,
        schedule,
        format,
        userId,
        status: "active"
      }
    })

    return NextResponse.json({
      success: true,
      report: {
        ...report,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error("Error creating report:", error)
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    )
  }
}
