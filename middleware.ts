import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  // Temporarily disable authentication for testing
  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"],
}
