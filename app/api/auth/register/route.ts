import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"

// Type stub for development (until Prisma is fully set up)
type Industry = "education" | "corporate" | "creative" | "medical"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, industry } = body

    // Validate required fields
    if (!email || !password || !fullName || !industry) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được đăng ký" },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)

    // Create user with default settings
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        industry: industry as Industry,
        settings: {
          create: {
            notifications: true,
            emailUpdates: true,
            language: "en",
            theme: "dark",
          },
        },
      },
      include: {
        settings: true,
      },
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: "User registered successfully",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Đã xảy ra lỗi, vui lòng thử lại" },
      { status: 500 }
    )
  }
}
