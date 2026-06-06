'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/context/workspace-context'
import { useUser } from '@/context/user-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Check, Users } from 'lucide-react'

export function PendingInvitations() {
  const { checkPendingInvitations, refreshWorkspace } = useWorkspace()
  const { userId, userData } = useUser()
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    // Get user email from userData or localStorage
    const email = userData?.email || localStorage.getItem('userEmail') || ''
    setUserEmail(email)
    if (email) {
      loadPendingInvitations(email)
    }
  }, [userData])

  const loadPendingInvitations = async (email: string) => {
    if (!email) return
    
    try {
      setLoading(true)
      const invitations = await checkPendingInvitations(email)
      setPendingInvitations(invitations)
    } catch (error) {
      console.error('Failed to load pending invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async (invitationId: string, workspaceId: string) => {
    try {
      // Accept invitation by calling the accept endpoint with email
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          userId: userId
        })
      })

      if (response.ok) {
        // Remove from pending list
        setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId))
        // Refresh workspaces list
        await refreshWorkspace()
        // Redirect to workspaces page to refresh the list
        window.location.href = '/workspaces'
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to accept invitation')
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error)
      alert('Failed to accept invitation')
    }
  }

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${invitationId}/invitations`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove from pending list
        setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId))
      } else {
        alert('Failed to decline invitation')
      }
    } catch (error) {
      console.error('Failed to decline invitation:', error)
      alert('Failed to decline invitation')
    }
  }

  if (loading) {
    return null
  }

  if (pendingInvitations.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Card className="border-blue-200 bg-blue-50 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Pending Invitations ({pendingInvitations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingInvitations.map((invitation) => (
            <div key={invitation.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {invitation.workspaceName}
                </div>
                <div className="text-sm text-gray-600">
                  Invited by {invitation.invitedByName} ({invitation.invitedByEmail})
                </div>
                <Badge variant="secondary" className="mt-1">
                  {invitation.role}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  size="sm"
                  onClick={() => handleAcceptInvitation(invitation.id, invitation.workspaceId)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeclineInvitation(invitation.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
