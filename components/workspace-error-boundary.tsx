"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface WorkspaceErrorBoundaryProps {
  error?: string | null
  notFound?: boolean
  title?: string
  message?: string
  className?: string
}

export function WorkspaceErrorBoundary({ 
  error, 
  notFound, 
  title, 
  message,
  className = "min-h-screen bg-gray-50 flex items-center justify-center"
}: WorkspaceErrorBoundaryProps) {
  const router = useRouter()

  if (error) {
    return (
      <div className={className}>
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              {title || "Error"}
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/workspaces')}>
              Back to Workspaces
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className={className}>
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">
              {title || "Workspace Not Found"}
            </h2>
            <p className="text-gray-600 mb-4">
              {message || "The workspace you're looking for doesn't exist."}
            </p>
            <Button onClick={() => router.push('/workspaces')}>
              Back to Workspaces
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
