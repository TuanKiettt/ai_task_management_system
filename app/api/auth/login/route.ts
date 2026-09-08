import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getTwoFactorByUserId } from "@/lib/totp-service"
import { hashPassword, verifyPassword } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 })
    }

    const isLegacyPassword = !user.password.startsWith("$2")
    const passwordMatch = isLegacyPassword
      ? user.password === password
      : await verifyPassword(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json({ error: "Mật khẩu không đúng" }, { status: 401 })
    }

    // Upgrade legacy plaintext passwords after a successful login.
    if (isLegacyPassword) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(password) },
      })
    }

    // Check if user has 2FA enabled
    const twoFactor = await getTwoFactorByUserId(user.id)

    if (twoFactor && twoFactor.enabled) {
      // Return user info but indicate 2FA verification is needed
      return NextResponse.json({
        requiresTwoFactor: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        },
        message: "Please complete two-factor authentication"
      }, { status: 200 })
    }

    // No 2FA enabled, return full user data
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          industry: user.industry,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại" }, { status: 500 })
  }
}
