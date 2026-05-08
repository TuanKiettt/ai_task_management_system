"use client"

import { HydrationFix } from "@/components/hydration-fix"

interface AppWrapperProps {
  children: React.ReactNode
}

/**
 * Wrap entire app to prevent hydration errors
 */
export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <HydrationFix fallback={<div className="min-h-screen bg-background">Loading...</div>}>
      {children}
    </HydrationFix>
  )
}
