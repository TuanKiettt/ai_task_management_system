"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  Building2, 
  Users, 
  Settings, 
  Plus,
  Crown,
  Shield,
  User,
  Activity,
  TrendingUp,
  Search,
  MessageCircle
} from "lucide-react"
import { useWorkspace } from "@/context/workspace-context"
import { useTasks } from "@/context/task-context"
import { WorkspaceSelector } from "./workspace-selector"
import { formatDistanceToNow } from "date-fns"

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  member: User
}

export function WorkspaceSidebar() {
  const { 
    currentWorkspace, 
    members, 
    invitations, 
    loading: workspaceLoading,
    createWorkspace,
    setCurrentWorkspace
  } = useWorkspace()
  const { tasks, getTaskStats } = useTasks()
  
  const [stats, setStats] = useState({
    tasks: { total: 0, completed: 0, overdue: 0 },
    members: { total: 0, active: 0 },
  })
  
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (currentWorkspace && tasks) {
      const workspaceTasks = tasks.filter(task => task.workspaceId === currentWorkspace.id)
      const taskStats = getTaskStats()
      
      setStats({
        tasks: {
          total: workspaceTasks.length,
          completed: taskStats.done,
          overdue: taskStats.overdue || 0
        },
        members: {
          total: members.length,
          active: members.filter(m => m.isActive).length
        }
      })
    }
  }, [currentWorkspace, tasks, members, getTaskStats])

  if (workspaceLoading) {
    return (
      <div className="space-y-4">
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center py-6">
              <Building2 className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-2">No Workspace</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a workspace to collaborate with your team
              </p>
              <WorkspaceSelector />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getUserRole = (workspace: any) => {
    if (typeof window === 'undefined') return "member" // Default for SSR
    
    const userData = JSON.parse(localStorage.getItem('userData') || '{}')
    if (workspace.ownerId === userData?.id) return "owner"
    
    const member = workspace.members?.find((m: any) => m.userId === userData?.id)
    return (member?.role as keyof typeof ROLE_ICONS) || "member"
  }

  const userRole = getUserRole(currentWorkspace)
  const RoleIcon = ROLE_ICONS[userRole]

  return (
    <div className="space-y-4">
      {/* Workspace Selector */}
      <WorkspaceSelector />

      {/* Current Workspace Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Current Workspace
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              {currentWorkspace.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{currentWorkspace.name}</h4>
              {currentWorkspace.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {currentWorkspace.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RoleIcon className="w-3 h-3" />
            <span className="capitalize">{userRole}</span>
          </div>

          {currentWorkspace.createdAt && mounted && (
            <div className="text-xs text-muted-foreground">
              Created {formatDistanceToNow(new Date(currentWorkspace.createdAt), { addSuffix: true })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tasks</span>
              <span className="font-medium">{stats.tasks.total}</span>
            </div>
            <Progress 
              value={stats.tasks.total > 0 ? (stats.tasks.completed / stats.tasks.total) * 100 : 0} 
              className="h-2" 
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stats.tasks.completed} completed</span>
              <span>{stats.tasks.total > 0 ? Math.round((stats.tasks.completed / stats.tasks.total) * 100) : 0}%</span>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Team Members</span>
            <span className="font-medium">{stats.members.total}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pending Invites</span>
            <span className="font-medium">{invitations.filter(i => i.status === 'pending').length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Show max 4 members */}
            {members.slice(0, 4).map((member) => {
              const MemberIcon = ROLE_ICONS[member.role]
              return (
                <div key={member.id} className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={member.user?.avatar} />
                    <AvatarFallback className="text-xs">
                      {member.user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium truncate">
                        {member.user?.fullName}
                      </span>
                      <Badge variant="outline" className="gap-1 px-1 py-0 text-xs">
                        <MemberIcon className="w-2 h-2" />
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {members.length > 4 && (
              <div className="text-xs text-muted-foreground pt-1">
                +{members.length - 4} more members
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {userRole !== "member" && (
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              Invite Members
            </Button>
          )}
          <Button variant="outline" size="sm" className="w-full justify-start">
            <MessageCircle className="w-4 h-4 mr-2" />
            Workspace Chat
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Search className="w-4 h-4 mr-2" />
            Search Tasks
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Settings className="w-4 h-4 mr-2" />
            Workspace Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
