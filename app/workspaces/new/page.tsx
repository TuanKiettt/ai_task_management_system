'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/context/workspace-context'
import { useUser } from '@/context/user-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus } from 'lucide-react'

export default function NewWorkspacePage() {
  const router = useRouter()
  const { userId } = useUser()
  const { createWorkspace } = useWorkspace()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !userId) {
      setError('Workspace name is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const workspace = await createWorkspace({
        name: name.trim(),
        description: description.trim(),
        ownerId: userId,
        role: 'owner',
        settings: {
          allowGuestAccess: false,
          requireApprovalForJoin: false,
          defaultTaskVisibility: 'private',
          enableFileUploads: true,
          maxFileSize: 10485760,
          allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png']
        },
        securitySettings: {
          enableTwoFactor: false,
          sessionTimeout: 3600,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: false,
            requireNumbers: false,
            requireSymbols: false
          },
          ipWhitelist: [],
          auditLogRetention: 90
        },
        defaultPermissions: [
          'view_tasks',
          'create_tasks',
          'edit_own_tasks',
          'comment_tasks'
        ],
        isActive: true
      })

      if (workspace) {
        router.push(`/workspaces/${workspace.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/workspaces')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workspaces
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Create New Workspace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Workspace Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter workspace name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter workspace description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/workspaces')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Workspace'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
