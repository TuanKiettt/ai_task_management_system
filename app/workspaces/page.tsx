'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/context/workspace-context'
import { useUser } from '@/context/user-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Plus, 
  Settings, 
  Users, 
  Calendar, 
  Activity,
  TrendingUp,
  Search,
  Filter,
  MoreHorizontal,
  Star
} from 'lucide-react'

export default function WorkspacesPage() {
  const router = useRouter()
  const { userId } = useUser()
  const { workspaces, createWorkspace } = useWorkspace()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'owner' | 'member'>('all')

  useEffect(() => {
    if (userId) {
      setLoading(false)
    }
  }, [userId])

  const filteredWorkspaces = workspaces.filter(workspace => {
    const matchesSearch = workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || 
      (filterType === 'owner' && workspace.ownerId === userId) ||
      (filterType === 'member' && workspace.ownerId !== userId)
    
    return matchesSearch && matchesFilter
  })

  const handleCreateWorkspace = async () => {
    try {
      const workspaceData = {
        name: 'New Workspace',
        description: 'Created from workspaces page',
        ownerId: userId || '',
        settings: {
          theme: 'default',
          notifications: true,
          allowInvites: true,
          allowGuestAccess: false,
          requireApprovalForJoin: false,
          defaultTaskVisibility: 'public' as 'public' | 'private',
          enableFileUploads: true,
          maxFileSize: 10,
          allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png']
        },
        defaultPermissions: [
          'view_tasks',
          'create_tasks',
          'edit_own_tasks',
          'comment_tasks'
        ],
        securitySettings: {
          enableTwoFactor: false,
          sessionTimeout: 30,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: false,
            requireNumbers: false,
            requireSymbols: false
          },
          ipWhitelist: [],
          auditLogRetention: 90
        },
        isActive: true
      }

      const newWorkspace = await createWorkspace(workspaceData)
      router.push(`/workspaces/${newWorkspace.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspaces...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
              <p className="text-sm text-gray-600">
                Manage your workspaces and collaborate with your team
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search workspaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button onClick={() => router.push('/workspaces/new')}>
                <Plus className="h-4 w-4 mr-2" />
                New Workspace
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Workspaces</p>
                  <p className="text-2xl font-bold text-gray-900">{workspaces.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Star className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Owner Workspaces</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workspaces.filter(w => w.ownerId === userId).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Member Workspaces</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workspaces.filter(w => w.ownerId !== userId).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active This Week</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setFilterType('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filterType === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Workspaces ({workspaces.length})
              </button>
              <button
                onClick={() => setFilterType('owner')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filterType === 'owner'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Owner ({workspaces.filter(w => w.ownerId === userId).length})
              </button>
              <button
                onClick={() => setFilterType('member')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filterType === 'member'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Member ({workspaces.filter(w => w.ownerId !== userId).length})
              </button>
            </nav>
          </div>
        </div>

        {/* Workspaces Grid */}
        {filteredWorkspaces.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="max-w-sm mx-auto">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No workspaces found' : 'No workspaces yet'}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {searchQuery 
                    ? 'Try adjusting your search terms or filters'
                    : 'Create your first workspace to get started with team collaboration'
                  }
                </p>
                <Button onClick={() => router.push('/workspaces/new')} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Workspace
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkspaces.map((workspace) => (
              <Card key={workspace.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent 
                  className="p-6"
                  onClick={() => router.push(`/workspaces/${workspace.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {workspace.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {workspace.description || 'No description available'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {workspace.ownerId === userId && (
                        <Badge variant="secondary" className="text-xs">
                          Owner
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>0 members</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>0 tasks</span>
                      </div>
                    </div>
                    <div>
                      Created {new Date(workspace.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/workspaces/${workspace.id}`)
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        View Workspace
                      </Button>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/workspaces/${workspace.id}/settings`)
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-6 text-center">
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
