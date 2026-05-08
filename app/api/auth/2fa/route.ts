import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getTwoFactorByUserId, disableTwoFactor, regenerateBackupCodes } from "@/lib/totp-service"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user's 2FA settings
    const twoFactor = await getTwoFactorByUserId(userId)

    if (!twoFactor) {
      return NextResponse.json({
        enabled: false,
        message: "2FA is not set up for this account"
      })
    }

    // Return 2FA status (without sensitive data)
    return NextResponse.json({
      enabled: twoFactor.enabled,
      createdAt: twoFactor.createdAt,
      lastUsedAt: twoFactor.lastUsedAt,
      backupCodesCount: twoFactor.backupCodes.filter(bc => !bc.used).length,
      backupCodesTotal: twoFactor.backupCodes.length
    })

  } catch (error) {
    console.error("Get 2FA status error:", error)
    return NextResponse.json({ error: "Failed to get 2FA status" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, password } = await req.json()

    if (!userId || !password) {
      return NextResponse.json({ 
        error: "User ID and password are required" 
      }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify password (in production, use proper password hashing)
    if (user.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 })
    }

    // Disable 2FA
    await disableTwoFactor(userId)

    return NextResponse.json({
      success: true,
      message: "2FA has been disabled for your account"
    })

  } catch (error) {
    console.error("Disable 2FA error:", error)
    return NextResponse.json({ error: "Failed to disable 2FA" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId, password } = await req.json()

    if (!userId || !password) {
      return NextResponse.json({ 
        error: "User ID and password are required" 
      }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify password (in production, use proper password hashing)
    if (user.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 })
    }

    // Regenerate backup codes
    const newBackupCodes = await regenerateBackupCodes(userId)

    return NextResponse.json({
      success: true,
      backupCodes: newBackupCodes,
      message: "New backup codes have been generated"
    })

  } catch (error) {
    console.error("Regenerate backup codes error:", error)
    return NextResponse.json({ error: "Failed to regenerate backup codes" }, { status: 500 })
  }
}
