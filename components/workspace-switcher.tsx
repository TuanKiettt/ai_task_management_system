"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  Plus, 
  Settings, 
  Crown,
  Shield,
  User,
  ChevronDown,
  Check
} from "lucide-react"
import { useWorkspace } from "@/context/workspace-context"
import { useUser } from "@/context/user-context"
import type { WorkspaceRole, Visibility } from "@/context/workspace-context"

interface WorkspaceSwitcherProps {
  className?: string
}

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  member: User
}

export function WorkspaceSwitcher({ className }: WorkspaceSwitcherProps) {
  const { 
    currentWorkspace, 
    members, 
    setCurrentWorkspace,
    createWorkspace,
    loading 
  } = useWorkspace()
  const { userData } = useUser()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [workspaceName, setWorkspaceName] = useState("")
  const [userWorkspaces, setUserWorkspaces] = useState<any[]>([])

  // Fetch user's workspaces
  useEffect(() => {
    if (!userData) return

    const fetchUserWorkspaces = async () => {
      try {
        const response = await fetch(`/api/workspaces?userId=${userData.id}`)
        if (response.ok) {
          const workspaces = await response.json()
          setUserWorkspaces(workspaces)
        }
      } catch (error) {
        console.error("Failed to fetch workspaces:", error)
      }
    }

    fetchUserWorkspaces()
  }, [userData])

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim() || !userData) return

    try {
      setIsCreating(true)
      
      const defaultSettings = {
        allowGuestAccess: false,
        requireApprovalForJoin: true,
        defaultTaskVisibility: "private" as Visibility,
        enableFileUploads: true,
        maxFileSize: 10485760,
        allowedFileTypes: ["pdf", "doc", "docx", "txt", "jpg", "png", "gif"]
      }

      const defaultSecuritySettings = {
        enableTwoFactor: false,
        sessionTimeout: 3600,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSymbols: false
        },
        ipWhitelist: [],
        auditLogRetention: 90
      }

      const newWorkspace = await createWorkspace({
        name: workspaceName.trim(),
        description: "",
        ownerId: userData.id,
        settings: defaultSettings,
        defaultPermissions: ["view_tasks", "create_tasks", "edit_own_tasks"],
        securitySettings: defaultSecuritySettings,
        isActive: true,
      })

      setUserWorkspaces(prev => [newWorkspace, ...prev])
      setIsCreateDialogOpen(false)
      setWorkspaceName("")
    } catch (error) {
      console.error("Failed to create workspace:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSwitchWorkspace = (workspace: any) => {
    setCurrentWorkspace(workspace)
  }

  const getUserRole = (workspace: any): WorkspaceRole => {
    if (workspace.ownerId === userData?.id) return "owner"
    
    const member = workspace.members?.find((m: any) => m.userId === userData?.id)
    return (member?.role as WorkspaceRole) || "member"
  }

  if (loading) {
    return (
      <div className={`h-10 bg-muted rounded animate-pulse ${className}`} />
    )
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {currentWorkspace ? (
                <>
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{currentWorkspace.name}</span>
                  {currentWorkspace.ownerId === userData?.id && (
                    <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                  )}
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  <span>Select Workspace</span>
                </>
              )}
            </div>
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Current Workspace */}
          {currentWorkspace && (
            <DropdownMenuItem 
              className="flex items-center gap-3 py-2"
              disabled
            >
              <Building2 className="w-4 h-4" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{currentWorkspace.name}</span>
                  <Check className="w-3 h-3 text-green-500" />
                </div>
                {currentWorkspace.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {currentWorkspace.description}
                  </p>
                )}
              </div>
            </DropdownMenuItem>
          )}
          
          {/* Other Workspaces */}
          {userWorkspaces
            .filter(w => w.id !== currentWorkspace?.id)
            .map((workspace) => {
              const userRole = getUserRole(workspace)
              const RoleIcon = ROLE_ICONS[userRole]
              
              return (
                <DropdownMenuItem 
                  key={workspace.id}
                  onClick={() => handleSwitchWorkspace(workspace)}
                  className="flex items-center gap-3 py-2"
                >
                  <Building2 className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{workspace.name}</span>
                      <RoleIcon className="w-3 h-3 text-muted-foreground" />
                    </div>
                    {workspace.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {workspace.description}
                      </p>
                    )}
                  </div>
                </DropdownMenuItem>
              )
            })}
          
          {userWorkspaces.length === 0 && !currentWorkspace && (
            <div className="px-2 py-4 text-center text-muted-foreground">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No workspaces yet</p>
            </div>
          )}
          
          <DropdownMenuSeparator />
          
          {/* Create New Workspace */}
          <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Workspace
          </DropdownMenuItem>
          
          {/* Settings */}
          {currentWorkspace && (
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Workspace Settings
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Workspace Dialog */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create New Workspace</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Workspace Name</label>
                <input
                  type="text"
                  placeholder="My Team Workspace"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                  disabled={isCreating}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
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
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
