import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Generate random string for guest link ID
function generateGuestId(length = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// GET all guest links for user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const links = await prisma.guestLink.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({
      success: true,
      links: links.map((link: any) => ({
        ...link,
        expiresAt: link.expiresAt?.toISOString() || null,
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString()
      }))
    })
  } catch (error) {
    console.error("Error fetching guest links:", error)
    return NextResponse.json(
      { error: "Failed to fetch guest links" },
      { status: 500 }
    )
  }
}

// POST create new guest link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, expiresAt, maxAccess, password, permissions, userId } = body

    if (!title || !description || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate unique URL
    const url = `https://alba.app/guest/${generateGuestId()}`

    const link = await prisma.guestLink.create({
      data: {
        title,
        description,
        url,
        userId,
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
        ...(maxAccess && { maxAccess }),
        ...(password && { password }),
        permissions: permissions ? JSON.stringify(permissions) : '["view"]'
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
    console.error("Error creating guest link:", error)
    return NextResponse.json(
      { error: "Failed to create guest link" },
      { status: 500 }
    )
  }
}
