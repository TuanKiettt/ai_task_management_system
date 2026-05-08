"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { useUser } from "./user-context"

export type WorkspaceRole = "owner" | "admin" | "member"
export type InvitationStatus = "pending" | "accepted" | "declined" | "expired"
export type Visibility = "public" | "private"

export interface WorkspaceSettings {
  allowGuestAccess: boolean
  requireApprovalForJoin: boolean
  defaultTaskVisibility: Visibility
  enableFileUploads: boolean
  maxFileSize: number
  allowedFileTypes: string[]
}

export interface SecuritySettings {
  enableTwoFactor: boolean
  sessionTimeout: number
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireNumbers: boolean
    requireSymbols: boolean
  }
  ipWhitelist: string[]
  auditLogRetention: number
}

export interface BillingInfo {
  plan: "free" | "pro" | "enterprise"
  subscriptionId?: string
  nextBillingDate?: Date
  usage: {
    users: number
    storage: number
    tasks: number
  }
  limits: {
    users: number
    storage: number
    tasks: number
  }
}

export interface Workspace {
  id: string
  name: string
  description?: string
  ownerId: string
  role?: WorkspaceRole // User's role in this workspace
  settings: WorkspaceSettings
  billingInfo?: BillingInfo
  defaultPermissions: string[]
  securitySettings: SecuritySettings
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: WorkspaceRole
  permissions: string[]
  invitedAt: Date
  joinedAt?: Date
  isActive: boolean
  user?: {
    id: string
    fullName: string
    email: string
    avatar?: string
  }
}

export interface WorkspaceInvitation {
  id: string
  workspaceId: string
  invitedEmail: string
  invitedBy: string
  role: WorkspaceRole
  token: string
  status: InvitationStatus
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
  workspace?: {
    id: string
    name: string
  }
  inviter?: {
    id: string
    fullName: string
    email: string
  }
}

interface WorkspaceContextType {
  // Current workspace
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  members: WorkspaceMember[]
  invitations: WorkspaceInvitation[]
  
  // Loading states
  loading: boolean
  error: string | null
  
  // Workspace management
  createWorkspace: (workspaceData: Omit<Workspace, "id" | "createdAt" | "updatedAt">) => Promise<Workspace>
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<Workspace>
  deleteWorkspace: (id: string) => Promise<void>
  setCurrentWorkspace: (workspace: Workspace | null) => void
  
  // Member management
  inviteMembers: (workspaceId: string, invitations: { email: string; role: WorkspaceRole }[]) => Promise<void>
  assignMemberRole: (memberId: string, role: WorkspaceRole) => Promise<void>
  updateMemberPermissions: (memberId: string, permissions: string[]) => Promise<void>
  removeMember: (memberId: string) => Promise<void>
  
  // Invitation management
  acceptInvitation: (token: string) => Promise<void>
  declineInvitation: (token: string) => Promise<void>
  cancelInvitation: (invitationId: string) => Promise<void>
  
  // Settings management
  updateWorkspaceSettings: (workspaceId: string, settings: Partial<WorkspaceSettings>) => Promise<void>
  updateSecuritySettings: (workspaceId: string, settings: Partial<SecuritySettings>) => Promise<void>
  updateBillingInfo: (workspaceId: string, billing: Partial<BillingInfo>) => Promise<void>
  
  // Audit logs
  getAuditLogs: (workspaceId: string) => Promise<any[]>
  
  // Refresh functions
  refreshWorkspace: () => Promise<void>
  refreshMembers: () => Promise<void>
  refreshInvitations: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { userId } = useUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  const getCurrentUserId = () => {
    return userId || "demo-user-123"
  }

  // Fetch all user workspaces
  const fetchWorkspaces = useCallback(async () => {
    const currentUserId = getCurrentUserId()
    if (!currentUserId) return

    try {
      setError(null)
      if (mounted) {
        console.log('Fetching workspaces for userId:', currentUserId)
      }
      const response = await fetch(`/api/workspaces?userId=${currentUserId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces')
      }

      const workspacesData = await response.json()
      if (mounted) {
        console.log('Fetched workspaces:', workspacesData)
      }
      setWorkspaces(workspacesData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces')
      if (mounted) {
        console.error('Error fetching workspaces:', err)
      }
    }
  }, [userId, mounted]) // Use userId instead of getCurrentUserId

  // Fetch current workspace
  const fetchCurrentWorkspace = useCallback(async () => {
    const currentUserId = getCurrentUserId()
    if (!currentUserId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      if (mounted) {
        console.log('Fetching current workspace for userId:', currentUserId)
      }

      const response = await fetch(`/api/workspaces/current?userId=${currentUserId}`)
      if (!response.ok) {
        if (response.status === 404) {
          // No current workspace set
          setCurrentWorkspace(null)
          return
        }
        throw new Error('Failed to fetch current workspace')
      }

      const workspace = await response.json()
      if (mounted) {
        console.log('Fetched current workspace:', workspace)
      }
      // Add role to workspace object
      const workspaceWithRole = {
        ...workspace,
        role: workspace.role || 'member'
      }
      setCurrentWorkspace(workspaceWithRole)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace')
      if (mounted) {
        console.error('Error fetching workspace:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [userId, mounted]) // Use userId instead of getCurrentUserId

  // Fetch workspace members
  const fetchMembers = useCallback(async () => {
    if (!currentWorkspace || !userId) return

    try {
      setError(null)
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members?userId=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }

      const membersData = await response.json()
      setMembers(membersData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members')
      console.error('Error fetching members:', err)
    }
  }, [currentWorkspace, userId])

  // Fetch workspace invitations
  const fetchInvitations = useCallback(async () => {
    if (!currentWorkspace || !userId) return

    try {
      setError(null)
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/invitations?userId=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch invitations')
      }

      const invitationsData = await response.json()
      setInvitations(invitationsData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations')
      console.error('Error fetching invitations:', err)
    }
  }, [currentWorkspace, userId])

  // Create workspace
  const createWorkspace = useCallback(async (workspaceData: Omit<Workspace, "id" | "createdAt" | "updatedAt">) => {
    try {
      setError(null)
      
      const currentUserId = getCurrentUserId()
      if (mounted) {
        console.log('Creating workspace with data:', { ...workspaceData, ownerId: currentUserId })
      }

      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...workspaceData,
          ownerId: currentUserId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (mounted) {
          console.error('Workspace creation failed:', response.status, errorData)
        }
        throw new Error(errorData.error || `Failed to create workspace (${response.status})`)
      }

      const workspace = await response.json()
      if (mounted) {
        console.log('Workspace created successfully:', workspace)
      }
      setCurrentWorkspace(workspace)
      
      // Refresh workspaces list
      await fetchWorkspaces()
      
      return workspace
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workspace'
      setError(errorMessage)
      if (mounted) {
        console.error('Error creating workspace:', err)
      }
      throw new Error(errorMessage)
    }
  }, [fetchWorkspaces, mounted])

  // Update workspace
  const updateWorkspace = useCallback(async (id: string, updates: Partial<Workspace>) => {
    try {
      setError(null)

      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update workspace')
      }

      const updatedWorkspace = await response.json()
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(updatedWorkspace)
      }
      return updatedWorkspace
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workspace')
      console.error('Error updating workspace:', err)
      throw err
    }
  }, [currentWorkspace])

  // Delete workspace
  const deleteWorkspace = useCallback(async (id: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/workspaces/${id}?userId=${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete workspace')
      }

      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(null)
        setMembers([])
        setInvitations([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workspace')
      console.error('Error deleting workspace:', err)
      throw err
    }
  }, [currentWorkspace, userId])

  // Invite members
  const inviteMembers = useCallback(async (workspaceId: string, invitations: { email: string; role: WorkspaceRole }[]) => {
    try {
      setError(null)

      const response = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitations }),
      })

      if (!response.ok) {
        throw new Error('Failed to send invitations')
      }

      await fetchInvitations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitations')
      console.error('Error inviting members:', err)
      throw err
    }
  }, [fetchInvitations])

  // Assign member role
  const assignMemberRole = useCallback(async (memberId: string, role: WorkspaceRole) => {
    try {
      setError(null)

      const response = await fetch(`/api/workspaces/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        throw new Error('Failed to update member role')
      }

      await fetchMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member role')
      console.error('Error assigning member role:', err)
      throw err
    }
  }, [fetchMembers])

  // Update member permissions
  const updateMemberPermissions = useCallback(async (memberId: string, permissions: string[]) => {
    try {
      setError(null)

      const response = await fetch(`/api/workspaces/members/${memberId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      })

      if (!response.ok) {
        throw new Error('Failed to update member permissions')
      }

      await fetchMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member permissions')
      console.error('Error updating member permissions:', err)
      throw err
    }
  }, [fetchMembers])

  // Remove member
  const removeMember = useCallback(async (memberId: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/workspaces/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove member')
      }

      await fetchMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
      console.error('Error removing member:', err)
      throw err
    }
  }, [fetchMembers])

  // Accept invitation
  const acceptInvitation = useCallback(async (token: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/workspaces/invitations/${token}/accept`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to accept invitation')
      }

      const workspace = await response.json()
      setCurrentWorkspace(workspace)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
      console.error('Error accepting invitation:', err)
      throw err
    }
  }, [])

  // Decline invitation
  const declineInvitation = useCallback(async (token: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/workspaces/invitations/${token}/decline`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to decline invitation')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline invitation')
      console.error('Error declining invitation:', err)
      throw err
    }
  }, [])

  // Cancel invitation
  const cancelInvitation = useCallback(async (invitationId: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/workspaces/invitations/${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to cancel invitation')
      }

      await fetchInvitations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invitation')
      console.error('Error canceling invitation:', err)
      throw err
    }
  }, [fetchInvitations])

  // Update workspace settings
  const updateWorkspaceSettings = useCallback(async (workspaceId: string, settings: Partial<WorkspaceSettings>) => {
    try {
      setError(null)

      const response = await fetch(`/api/workspaces/${workspaceId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to update workspace settings')
      }

      const updatedWorkspace = await response.json()
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace(updatedWorkspace)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workspace settings')
      console.error('Error updating workspace settings:', err)
      throw err
    }
  }, [currentWorkspace])

  // Update security settings
  const updateSecuritySettings = useCallback(async (workspaceId: string, settings: Partial<SecuritySettings>) => {
    try {
      setError(null)

      const response = await fetch(`/api/workspaces/${workspaceId}/security`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to update security settings')
      }

      const updatedWorkspace = await response.json()
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace(updatedWorkspace)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update security settings')
      console.error('Error updating security settings:', err)
      throw err
    }
  }, [currentWorkspace])

  // Update billing info
  const updateBillingInfo = useCallback(async (workspaceId: string, billing: Partial<BillingInfo>) => {
    try {
      setError(null)

      const response = await fetch(`/api/workspaces/${workspaceId}/billing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billing),
      })

      if (!response.ok) {
        throw new Error('Failed to update billing info')
      }

      const updatedWorkspace = await response.json()
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace(updatedWorkspace)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update billing info')
      console.error('Error updating billing info:', err)
      throw err
    }
  }, [currentWorkspace])

  // Get audit logs
  const getAuditLogs = useCallback(async (workspaceId: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/workspaces/${workspaceId}/audit-logs`)
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs')
      console.error('Error fetching audit logs:', err)
      throw err
    }
  }, [])

  // Load initial data
  useEffect(() => {
    if (mounted) {
      fetchCurrentWorkspace()
      fetchWorkspaces()
    }
  }, [userId, mounted]) // Only depend on userId and mounted

  // Only fetch members and invitations when explicitly requested
// useEffect(() => {
//   if (currentWorkspace && mounted) {
//     fetchMembers()
//     fetchInvitations()
//   }
// }, [currentWorkspace?.id, mounted]) // Only depend on workspace ID and mounted

  // Refresh functions
  const refreshWorkspace = useCallback(async () => {
    await fetchCurrentWorkspace()
    await fetchWorkspaces()
  }, []) // Remove function dependencies

  const refreshMembers = useCallback(async () => {
    if (currentWorkspace) {
      await fetchMembers()
    }
  }, [currentWorkspace?.id]) // Depend on workspace ID

  const refreshInvitations = useCallback(async () => {
    if (currentWorkspace) {
      await fetchInvitations()
    }
  }, [currentWorkspace?.id]) // Depend on workspace ID

  const contextValue: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    members,
    invitations,
    loading,
    error,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    setCurrentWorkspace,
    inviteMembers,
    assignMemberRole,
    updateMemberPermissions,
    removeMember,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
    updateWorkspaceSettings,
    updateSecuritySettings,
    updateBillingInfo,
    getAuditLogs,
    refreshWorkspace,
    refreshMembers,
    refreshInvitations,
  }

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
