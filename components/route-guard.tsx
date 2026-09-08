"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser } from "@/context/user-context"

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoggedIn, isReady } = useUser()

  useEffect(() => {
    if (!isReady) return
    
    const publicRoutes = ["/auth/login", "/auth/register", "/auth"]
    const isPublicRoute = publicRoutes.includes(pathname)

    // Only redirect if user context is ready and we're sure about authentication state
    if (isLoggedIn === false && !isPublicRoute) {
      console.log('Redirecting to login - not logged in')
      router.push("/auth/login")
    } else if (isLoggedIn === true && publicRoutes.includes(pathname)) {
      console.log('Redirecting to home - already logged in')
      router.push("/")
    }
  }, [isLoggedIn, pathname, router, isReady])

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#050B24] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
