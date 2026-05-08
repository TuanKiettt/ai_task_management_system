import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Secret key for JWT (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface AuthUser {
  id: string
  email: string
  fullName: string
  industry: string
}

// Generate JWT token
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      industry: user.industry,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  )
}

// Verify JWT token
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch (error) {
    return null
  }
}

// Extract token from request
export function extractToken(req: NextRequest): string | null {
  // Check Authorization header
  const authHeader = req.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  // Check cookies
  const token = req.cookies.get("auth-token")?.value
  return token || null
}

// Middleware to protect API routes
export function withAuth(handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const token = extractToken(req)
      
      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        )
      }

      const user = verifyToken(token)
      
      if (!user) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        )
      }

      return await handler(req, user)
    } catch (error) {
      console.error("Auth middleware error:", error)
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      )
    }
  }
}

// Middleware to check workspace membership
export function withWorkspaceAuth(
  handler: (req: NextRequest, user: AuthUser, workspaceId: string) => Promise<NextResponse>
) {
  return withAuth(async (req: NextRequest, user: AuthUser) => {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId") || 
                       req.headers.get("x-workspace-id")

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID required" },
        { status: 400 }
      )
    }

    // Here you would check if user is member of workspace
    // For now, we'll assume user has access
    return await handler(req, user, workspaceId)
  })
}

// Role-based access control
export function withRoleAuth(
  allowedRoles: string[],
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return withAuth(async (req: NextRequest, user: AuthUser) => {
    // Check user role (you'd get this from database)
    // For now, we'll assume all authenticated users have access
    return await handler(req, user)
  })
}

// Rate limiting middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (req: NextRequest) => {
      const clientId = req.headers.get("x-forwarded-for") || 
                       req.headers.get("x-real-ip") || 
                       "unknown"
      const now = Date.now()
      
      const rateLimitData = rateLimitMap.get(clientId)
      
      if (!rateLimitData || now > rateLimitData.resetTime) {
        // Reset or initialize rate limit
        rateLimitMap.set(clientId, {
          count: 1,
          resetTime: now + windowMs,
        })
        return await handler(req)
      }
      
      if (rateLimitData.count >= maxRequests) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429 }
        )
      }
      
      rateLimitData.count++
      return await handler(req)
    }
  }
}

// CORS middleware
export function withCors(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const response = await handler(req)
    
    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.set("Access-Control-Max-Age", "86400")
    
    return response
  }
}

// Request logging middleware
export function withLogging(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const start = Date.now()
    const method = req.method
    const url = req.url
    
    console.log(`[${new Date().toISOString()}] ${method} ${url}`)
    
    try {
      const response = await handler(req)
      const duration = Date.now() - start
      
      console.log(`[${new Date().toISOString()}] ${method} ${url} - ${response.status} (${duration}ms)`)
      
      return response
    } catch (error) {
      const duration = Date.now() - start
      
      console.error(`[${new Date().toISOString()}] ${method} ${url} - ERROR (${duration}ms)`, error)
      
      throw error
    }
  }
}
