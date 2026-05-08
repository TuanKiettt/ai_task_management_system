"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@/context/user-context'
import { useWorkspace } from '@/context/workspace-context'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { WorkspaceChat } from '@/components/workspace-chat'
import { WorkspaceErrorBoundary } from '@/components/workspace-error-boundary'

export default function WorkspaceChatPage() {
  const params = useParams()
  const router = useRouter()
  const { userId } = useUser()
  const { currentWorkspace } = useWorkspace()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const workspaceId = params.workspaceId as string

  useEffect(() => {
    if (!workspaceId || !userId) return

    const loadWorkspace = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/workspaces/${workspaceId}?userId=${userId}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Workspace not found')
          } else {
            throw new Error('Failed to fetch workspace')
          }
          return
        }
        
        const workspaceData = await response.json()
        // Set current workspace in context
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('setCurrentWorkspace', { 
            detail: workspaceData 
          }))
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workspace')
      } finally {
        setLoading(false)
      }
    }

    loadWorkspace()
  }, [workspaceId, userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  <WorkspaceErrorBoundary 
    error={error}
    notFound={!currentWorkspace}
  />

  if (!currentWorkspace) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push(`/workspaces/${workspaceId}`)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Workspace
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentWorkspace.name} - Chat
                </h1>
                <p className="text-sm text-gray-600">
                  Real-time team collaboration
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm text-gray-600">Team Chat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Component */}
      <div className="h-[calc(100vh-73px)]">
        <div className="h-full flex">
          <div className="flex-1">
            <WorkspaceChat />
          </div>
        </div>
      </div>
    </div>
  )
}
