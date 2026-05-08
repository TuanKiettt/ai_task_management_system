"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Building2, Users, Settings } from "lucide-react"
import { useWorkspace, type Workspace } from "@/context/workspace-context"
import { useUser } from "@/context/user-context"

interface WorkspaceSelectorProps {
  className?: string
}

export function WorkspaceSelector({ className }: WorkspaceSelectorProps) {
  const { currentWorkspace, createWorkspace, setCurrentWorkspace } = useWorkspace()
  const { userData } = useUser()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Form state
  const [workspaceName, setWorkspaceName] = useState("")
  const [workspaceDescription, setWorkspaceDescription] = useState("")

  // Debug logging
  console.log('WorkspaceSelector render:', { 
    currentWorkspace: currentWorkspace?.name, 
    userData: userData?.id,
    hasUserData: !!userData 
  })

  const handleCreateWorkspace = async () => {
    console.log('handleCreateWorkspace called:', { 
      workspaceName: workspaceName.trim(), 
      userData: userData?.id,
      hasUserData: !!userData 
    })
    
    if (!workspaceName.trim()) {
      console.error('Workspace name is required')
      alert('Please enter a workspace name')
      return
    }
    
    if (!userData) {
      console.error('User data is not available')
      alert('User data is not available. Please try refreshing the page.')
      return
    }

    try {
      setIsCreating(true)
      
      const defaultSettings = {
        allowGuestAccess: false,
        requireApprovalForJoin: true,
        defaultTaskVisibility: "private" as const,
        enableFileUploads: true,
        maxFileSize: 10485760, // 10MB
        allowedFileTypes: ["pdf", "doc", "docx", "txt", "jpg", "png", "gif"]
      }

      const defaultSecuritySettings = {
        enableTwoFactor: false,
        sessionTimeout: 3600, // 1 hour
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSymbols: false
        },
        ipWhitelist: [],
        auditLogRetention: 90 // days
      }

      console.log('Creating workspace with user:', userData.id)

      const newWorkspace = await createWorkspace({
        name: workspaceName.trim(),
        description: workspaceDescription.trim() || undefined,
        ownerId: userData.id,
        settings: defaultSettings,
        defaultPermissions: ["view_tasks", "create_tasks", "edit_own_tasks"],
        securitySettings: defaultSecuritySettings,
        isActive: true,
      })

      console.log('Workspace created successfully:', newWorkspace)
      
      setIsCreateDialogOpen(false)
      setWorkspaceName("")
      setWorkspaceDescription("")
      
      // Show success feedback
      alert(`Workspace "${newWorkspace.name}" created successfully!`)
    } catch (error) {
      console.error("Failed to create workspace:", error)
      alert(`Failed to create workspace: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className={className}>
      {currentWorkspace ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
          <Building2 className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <h3 className="font-semibold">{currentWorkspace.name}</h3>
            {currentWorkspace.description && (
              <p className="text-sm text-muted-foreground">{currentWorkspace.description}</p>
            )}
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
              <DialogDescription>
                Create a collaborative workspace to manage tasks and projects with your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  placeholder="My Team Workspace"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div>
                <Label htmlFor="workspace-description">Description (Optional)</Label>
                <Textarea
                  id="workspace-description"
                  placeholder="A brief description of your workspace..."
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  disabled={isCreating}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateWorkspace}
                disabled={!workspaceName.trim() || isCreating}
              >
                {isCreating ? "Creating..." : "Create Workspace"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
