import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET all automation rules for user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const rules = await prisma.automationRule.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({
      success: true,
      rules: rules.map((rule: any) => ({
        ...rule,
        lastRun: rule.lastRun?.toISOString() || null,
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString()
      }))
    })
  } catch (error) {
    console.error("Error fetching automation rules:", error)
    return NextResponse.json(
      { error: "Failed to fetch automation rules" },
      { status: 500 }
    )
  }
}

// POST create new automation rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, trigger, action, category, userId } = body

    if (!name || !description || !trigger || !action || !category || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const rule = await prisma.automationRule.create({
      data: {
        name,
        description,
        trigger,
        action,
        category,
        userId,
        isActive: true,
        executions: 0,
        status: "active"
      }
    })

    return NextResponse.json({
      success: true,
      rule: {
        ...rule,
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error("Error creating automation rule:", error)
    return NextResponse.json(
      { error: "Failed to create automation rule" },
      { status: 500 }
    )
  }
}
