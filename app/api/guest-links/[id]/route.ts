import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// PUT update guest link
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, description, isActive, expiresAt, maxAccess, password, permissions } = body
    const { id } = params

    const link = await prisma.guestLink.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
        ...(maxAccess && { maxAccess }),
        ...(password !== undefined && { password }),
        ...(permissions && { permissions: JSON.stringify(permissions) })
      }
    })

    return NextResponse.json({
      success: true,
      link: {
        ...link,
        expiresAt: link.expiresAt?.toISOString() || null,
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error("Error updating guest link:", error)
    return NextResponse.json(
      { error: "Failed to update guest link" },
      { status: 500 }
    )
  }
}

// DELETE guest link
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    await prisma.guestLink.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Guest link deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting guest link:", error)
    return NextResponse.json(
      { error: "Failed to delete guest link" },
      { status: 500 }
    )
  }
}

// POST increment access count
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const link = await prisma.guestLink.findUnique({
      where: { id }
    })

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    if (!link.isActive) {
      return NextResponse.json({ error: "Link is not active" }, { status: 403 })
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      return NextResponse.json({ error: "Link has expired" }, { status: 403 })
    }

    if (link.maxAccess && link.accessCount >= link.maxAccess) {
      return NextResponse.json({ error: "Access limit reached" }, { status: 403 })
    }

    const updatedLink = await prisma.guestLink.update({
      where: { id },
      data: { accessCount: { increment: 1 } }
    })

    return NextResponse.json({
      success: true,
      link: {
        ...updatedLink,
        permissions: JSON.parse(updatedLink.permissions),
        expiresAt: updatedLink.expiresAt?.toISOString() || null,
        createdAt: updatedLink.createdAt.toISOString(),
        updatedAt: updatedLink.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error("Error accessing guest link:", error)
    return NextResponse.json(
      { error: "Failed to access guest link" },
      { status: 500 }
    )
  }
}
