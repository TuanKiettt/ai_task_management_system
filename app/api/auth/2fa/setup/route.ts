import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { totpService, createTwoFactorRecord, enableTwoFactor } from "@/lib/totp-service"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if 2FA is already enabled
    const existing2FA = await prisma.userTwoFactor.findUnique({
      where: { userId }
    })

    if (existing2FA && existing2FA.enabled) {
      return NextResponse.json({ 
        error: "2FA is already enabled for this account" 
      }, { status: 400 })
    }

    // Generate TOTP setup
    const setup = await totpService.setupTOTP(user.email)

    // Store 2FA record (disabled until verified)
    const twoFactorRecord = await createTwoFactorRecord(userId, setup.secret, setup.backupCodes)

    // In a real implementation, you would save this to the database
    // For now, we'll store it in memory (not recommended for production)
    
    return NextResponse.json({
      success: true,
      qrCode: setup.qrCode,
      secret: setup.secret,
      manualEntryKey: setup.manualEntryKey,
      backupCodes: setup.backupCodes
    })

  } catch (error) {
    console.error("2FA setup error:", error)
    return NextResponse.json({ error: "Failed to setup 2FA" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId, token } = await req.json()

    if (!userId || !token) {
      return NextResponse.json({ 
        error: "User ID and verification token are required" 
      }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get 2FA record (in production, this would be from database)
    // For now, we'll assume the secret was stored during setup
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')

    if (!secret) {
      return NextResponse.json({ 
        error: "Secret not found. Please restart setup process." 
      }, { status: 400 })
    }

    // Verify the token
    const isValid = totpService.verifyToken(secret, token)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
    }

    // Enable 2FA for the user
    await enableTwoFactor(userId)

    return NextResponse.json({
      success: true,
      message: "2FA has been successfully enabled for your account"
    })

  } catch (error) {
    console.error("2FA verification error:", error)
    return NextResponse.json({ error: "Failed to verify 2FA" }, { status: 500 })
  }
}
