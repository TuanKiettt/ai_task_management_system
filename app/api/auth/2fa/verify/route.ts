import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { totpService, getTwoFactorByUserId, useBackupCode } from "@/lib/totp-service"

export async function POST(req: NextRequest) {
  try {
    const { userId, token, useBackupCode = false } = await req.json()

    if (!userId || !token) {
      return NextResponse.json({ 
        error: "User ID and verification code are required" 
      }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's 2FA settings
    const twoFactor = await getTwoFactorByUserId(userId)

    if (!twoFactor || !twoFactor.enabled) {
      return NextResponse.json({ 
        error: "2FA is not enabled for this account" 
      }, { status: 400 })
    }

    let isValid = false
    let usedBackupCode = false

    if (useBackupCode) {
      // Verify backup code
      const cleanCode = totpService.parseBackupCode(token)
      
      if (!totpService.isValidBackupCode(cleanCode)) {
        return NextResponse.json({ 
          error: "Invalid backup code format" 
        }, { status: 400 })
      }

      // Find unused backup code
      const backupCode = twoFactor.backupCodes.find(
        bc => bc.code === cleanCode && !bc.used
      )

      if (!backupCode) {
        return NextResponse.json({ 
          error: "Invalid or already used backup code" 
        }, { status: 400 })
      }

      // Mark backup code as used
      await useBackupCode(userId, cleanCode)
      isValid = true
      usedBackupCode = true

    } else {
      // Verify TOTP token
      isValid = totpService.verifyToken(twoFactor.secret, token)
    }

    if (!isValid) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
    }

    // Update last used timestamp
    // In production, this would update the database
    console.log(`2FA verified for user: ${userId}`)

    return NextResponse.json({
      success: true,
      verified: true,
      usedBackupCode,
      message: usedBackupCode 
        ? "Backup code verified successfully" 
        : "2FA verification successful"
    })

  } catch (error) {
    console.error("2FA verification error:", error)
    return NextResponse.json({ error: "Failed to verify 2FA" }, { status: 500 })
  }
}
