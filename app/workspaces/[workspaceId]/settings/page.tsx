'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWorkspace } from '@/context/workspace-context'
import { useUser } from '@/context/user-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Users, 
  Shield, 
  Bell, 
  Trash2,
  Save,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react'
import { WorkspaceErrorBoundary } from '@/components/workspace-error-boundary'

export default function WorkspaceSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { userId } = useUser()
  const { currentWorkspace, updateWorkspace, deleteWorkspace } = useWorkspace()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    allowInvites: true,
    requireApproval: false
  })

  const workspaceId = params.workspaceId as string

  useEffect(() => {
    if (!currentWorkspace) return

    setFormData({
      name: currentWorkspace.name || '',
      description: currentWorkspace.description || '',
      allowInvites: true, // Default values
      requireApproval: false
    })
    setLoading(false)
  }, [currentWorkspace])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentWorkspace || !userId) return

    try {
      setSaving(true)
      setError(null)

      await updateWorkspace(currentWorkspace.id, {
        name: formData.name,
        description: formData.description
      })

      router.push(`/workspaces/${workspaceId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workspace')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!currentWorkspace || !userId) return
    
    const confirmDelete = confirm('Are you sure you want to delete this workspace? This action cannot be undone.')
    if (!confirmDelete) return

    try {
      await deleteWorkspace(currentWorkspace.id)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workspace')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspace settings...</p>
        </div>
      </div>
    )
  }

  <WorkspaceErrorBoundary 
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
                  Workspace Settings
                </h1>
                <p className="text-sm text-gray-600">
                  {currentWorkspace.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Workspace Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      placeholder="Describe your workspace..."
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.push(`/workspaces/${workspaceId}`)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Member Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Member Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Invite Members</h4>
                      <p className="text-sm text-gray-500">Allow members to invite others</p>
                    </div>
                    <Switch checked={formData.allowInvites} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Require Approval</h4>
                      <p className="text-sm text-gray-500">New members need approval</p>
                    </div>
                    <Switch checked={formData.requireApproval} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Workspace Info */}
            <Card>
              <CardHeader>
                <CardTitle>Workspace Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <strong>ID:</strong>
                    <div className="text-sm text-gray-600 font-mono">{currentWorkspace.id}</div>
                  </div>
                  <div>
                    <strong>Created:</strong>
                    <div className="text-sm text-gray-600">
                      {new Date(currentWorkspace.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <strong>Your Role:</strong>
                    <div className="mt-1">
                      <Badge variant="secondary">
                        {currentWorkspace.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <Trash2 className="h-5 w-5 mr-2" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-red-600">Delete Workspace</h4>
                    <p className="text-sm text-gray-500 mb-2">
                      Once you delete a workspace, there is no going back. Please be certain.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={handleDelete}
                      className="w-full"
                    >
                      Delete Workspace
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
