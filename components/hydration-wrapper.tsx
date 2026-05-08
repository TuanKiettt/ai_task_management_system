"use client"

import { useEffect, useState } from 'react'

interface HydrationWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Wrapper to prevent hydration mismatches caused by browser extensions
 * or dynamic content that differs between server and client
 */
export function HydrationWrapper({ children, fallback = null }: HydrationWrapperProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // This will only run on the client
    setIsHydrated(true)
  }, [])

  // Return fallback during SSR/hydration, actual content after
  if (!isHydrated) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
