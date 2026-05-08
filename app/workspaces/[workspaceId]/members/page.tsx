'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWorkspace } from '@/context/workspace-context'
import { useUser } from '@/context/user-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Settings, 
  Mail, 
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Shield,
  ArrowLeft,
  Crown
} from 'lucide-react'
import { WorkspaceErrorBoundary } from '@/components/workspace-error-boundary'
import { InviteMembersModal } from '@/components/workspace/invite-members-modal'

export default function WorkspaceMembersPage() {
  const params = useParams()
  const router = useRouter()
  const { userId } = useUser()
  const { currentWorkspace, members, refreshMembers } = useWorkspace()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'admin' | 'member'>('all')

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

  useEffect(() => {
    if (currentWorkspace && userId) {
      refreshMembers()
    }
  }, [currentWorkspace?.id, userId, refreshMembers])

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'all' || member.role === filterRole
    
    return matchesSearch && matchesRole
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-red-100 text-red-800'
      case 'admin': return 'bg-orange-100 text-orange-800'
      case 'member': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!currentWorkspace || !userId) return
    
    const confirmRemove = confirm('Are you sure you want to remove this member? This action cannot be undone.')
    if (!confirmRemove) return

    try {
      setError(null)
      const response = await fetch(`/api/workspaces/${currentWorkspace?.id}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove member')
      }

      await refreshMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      setError(null)
      const response = await fetch(`/api/workspaces/${currentWorkspace?.id}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error('Failed to update member role')
      }

      await refreshMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member role')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading members...</p>
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
                  {currentWorkspace.name} - Members
                </h1>
                <p className="text-sm text-gray-600">
                  Manage workspace members and permissions
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => setShowInviteModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
              <Button variant="outline" onClick={() => router.push(`/workspaces/${workspaceId}/settings`)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {members.filter(m => m.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Invites</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterRole} onValueChange={(value: any) => setFilterRole(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Members ({filteredMembers.length})</CardTitle>
            <Button variant="outline" onClick={() => setShowInviteModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Members
            </Button>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery || filterRole !== 'all' 
                  ? 'No members found matching your filters'
                  : 'No members in this workspace yet.'
                }
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.user?.avatar} />
                        <AvatarFallback>
                          {member.user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">{member.user?.fullName || 'Unknown User'}</div>
                        <div className="text-sm text-gray-600">{member.user?.email || 'No email'}</div>
                        <div className="text-xs text-gray-500">
                          Joined {new Date(member.joinedAt || member.invitedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={getRoleColor(member.role)}>
                        {member.role}
                      </Badge>
                      
                      {member.role !== 'owner' && currentWorkspace.role === 'owner' && (
                        <Select 
                          value={member.role} 
                          onValueChange={(value: any) => handleUpdateRole(member.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      
                      {member.role !== 'owner' && currentWorkspace.role === 'owner' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="mt-6 text-center">
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          </div>
        )}
      </div>
      
      {/* Invite Members Modal */}
      <InviteMembersModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  )
}
