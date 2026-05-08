import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import prisma from "@/lib/prisma"
import { emailService } from "@/lib/email-service"

// Store reset tokens (in production, use Redis)
const resetTokens = new Map<string, { email: string; expires: number }>()

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if user exists for security
      return NextResponse.json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      })
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = Date.now() + 3600000 // 1 hour

    // Store token (in production, use database or Redis)
    resetTokens.set(token, { email, expires })

    // Send email with reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`
    
    const emailSent = await emailService.sendPasswordReset(email, resetUrl, user.fullName)
    
    if (!emailSent) {
      console.error('Failed to send password reset email')
      // Still return success for security, but log the error
    }

    return NextResponse.json({ 
      message: "Password reset link sent successfully",
      // Only return token in development for testing
      ...(process.env.NODE_ENV === 'development' && { resetUrl, token })
    })

  } catch (error) {
    console.error("Password reset request error:", error)
    return NextResponse.json({ error: "Failed to process reset request" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json()

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 })
    }

    // Check if token exists and is valid
    const resetData = resetTokens.get(token)
    
    if (!resetData || resetData.expires < Date.now()) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: resetData.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update password (in production, hash the password)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newPassword } // TODO: Hash password
    })

    // Remove used token
    resetTokens.delete(token)

    return NextResponse.json({ message: "Password reset successfully" })

  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
