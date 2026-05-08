"use client"

import { useEffect, useState } from "react"

interface HydrationFixProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Fix React hydration errors by preventing server/client mismatches
 */
export function HydrationFix({ children, fallback = null }: HydrationFixProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Return fallback on server, children on client
  if (!isClient) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Generate stable IDs to prevent hydration mismatches
 */
export function generateStableId(): string {
  // Use crypto.randomUUID() instead of Date.now() for stable IDs
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback for older browsers
  return `id-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate stable timestamp for hydration
 */
export function getStableTimestamp(): Date {
  return new Date()
}
