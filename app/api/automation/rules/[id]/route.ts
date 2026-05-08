import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// PUT update automation rule
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, description, trigger, action, category, isActive } = body
    const { id } = params

    const rule = await prisma.automationRule.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(trigger && { trigger }),
        ...(action && { action }),
        ...(category && { category }),
        ...(isActive !== undefined && { isActive })
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
    console.error("Error updating automation rule:", error)
    return NextResponse.json(
      { error: "Failed to update automation rule" },
      { status: 500 }
    )
  }
}

// DELETE automation rule
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    await prisma.automationRule.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Automation rule deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting automation rule:", error)
    return NextResponse.json(
      { error: "Failed to delete automation rule" },
      { status: 500 }
    )
  }
}
