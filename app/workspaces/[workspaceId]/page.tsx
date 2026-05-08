'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWorkspace } from '@/context/workspace-context'
import { useUser } from '@/context/user-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Settings, Calendar, Plus, MessageSquare } from 'lucide-react'
import { InviteMembersModal } from '@/components/workspace/invite-members-modal'
import { WorkspaceErrorBoundary } from '@/components/workspace-error-boundary'

export default function WorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const { userId } = useUser()
  const { currentWorkspace, setCurrentWorkspace, members, refreshMembers } = useWorkspace()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)

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
        setCurrentWorkspace(workspaceData)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workspace')
      } finally {
        setLoading(false)
      }
    }

    loadWorkspace()
  }, [workspaceId, userId, setCurrentWorkspace])

  useEffect(() => {
    if (currentWorkspace && userId) {
      refreshMembers()
    }
  }, [currentWorkspace?.id, userId, refreshMembers])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    )
  }

  <WorkspaceErrorBoundary 
    error={error}
    notFound={!currentWorkspace}
    message="The workspace you are looking for does not exist."
  />

  if (!currentWorkspace) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentWorkspace.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {currentWorkspace.description || 'No description'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => router.push(`/workspaces/${workspaceId}/settings`)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Task Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">Total Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">0</div>
                    <div className="text-sm text-gray-600">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">0</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Recent Tasks</CardTitle>
                <Button variant="outline" size="sm" onClick={() => router.push(`/workspaces/${workspaceId}/tasks`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  No tasks yet. Create your first task to get started.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Members ({members.length})
                  </span>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.user?.avatar} />
                          <AvatarFallback>
                            {member.user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{member.user?.fullName || 'Unknown User'}</div>
                          <div className="text-xs text-gray-500">{member.user?.email || 'No email'}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => setShowInviteModal(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Invite Members
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/workspaces/${workspaceId}/chat`)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Open Chat
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/workspaces/${workspaceId}/settings`)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Workspace Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Invite Members Modal */}
      <InviteMembersModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  )
}
