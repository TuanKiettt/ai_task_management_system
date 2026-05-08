"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  Building2, 
  Settings, 
  Crown,
  Shield,
  User,
  Mail,
  Calendar,
  Activity,
  TrendingUp
} from "lucide-react"
import { useWorkspace } from "@/context/workspace-context"
import { useProjects } from "@/context/projects-context"
import { useTasks } from "@/context/task-context"
import { WorkspaceInvite } from "./workspace-invite"
import { formatDistanceToNow } from "date-fns"

interface WorkspaceDashboardProps {
  className?: string
}

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  member: User
}

export function WorkspaceDashboard({ className }: WorkspaceDashboardProps) {
  const { 
    currentWorkspace, 
    members, 
    invitations, 
    loading: workspaceLoading 
  } = useWorkspace()
  const { projects, getProjectStats } = useProjects()
  const { tasks, getTaskStats } = useTasks()
  
  const [stats, setStats] = useState({
    projects: { total: 0, active: 0, completed: 0 },
    tasks: { total: 0, completed: 0, overdue: 0 }
  })
  
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (currentWorkspace && tasks && mounted) {
      const workspaceTasks = tasks.filter(task => task.workspaceId === currentWorkspace.id)
      const taskStats = getTaskStats()
      
      setStats({
        projects: { total: 0, active: 0, completed: 0 }, // TODO: Implement projects logic
        tasks: {
          total: workspaceTasks.length,
          completed: taskStats.done,
          overdue: taskStats.overdue || 0
        }
      })
    }
  }, [currentWorkspace, tasks, getTaskStats, mounted])

  if (workspaceLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-semibold mb-2">No Workspace Selected</h2>
        <p className="text-muted-foreground mb-6">
          Create or join a workspace to start collaborating with your team.
        </p>
      </div>
    )
  }

  const activeMembers = members.filter(m => m.isActive)
  const pendingInvitations = invitations.filter(i => i.status === "pending")

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Workspace Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{currentWorkspace.name}</h1>
          {currentWorkspace.description && (
            <p className="text-muted-foreground mt-1">{currentWorkspace.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <WorkspaceInvite workspaceId={currentWorkspace.id} />
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.projects.active} active, {stats.projects.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasks.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.tasks.completed} completed, {stats.tasks.overdue} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingInvitations.length} pending invitations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.tasks.total > 0 
                ? Math.round((stats.tasks.completed / stats.tasks.total) * 100)
                : 0}%
            </div>
            <Progress 
              value={stats.tasks.total > 0 
                ? (stats.tasks.completed / stats.tasks.total) * 100 
                : 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeMembers.slice(0, 5).map((member) => {
                const RoleIcon = ROLE_ICONS[member.role]
                return (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.user?.avatar} />
                      <AvatarFallback>
                        {member.user?.fullName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{member.user?.fullName}</span>
                        <Badge variant="secondary" className="text-xs">
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {member.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {member.user?.email}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {mounted && (
                        <>
                          {member.joinedAt 
                            ? `Joined ${formatDistanceToNow(member.joinedAt, { addSuffix: true })}`
                            : `Invited ${formatDistanceToNow(member.invitedAt, { addSuffix: true })}`
                          }
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {activeMembers.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm">
                    View all {activeMembers.length} members
                  </Button>
                </div>
              )}

              {activeMembers.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No team members yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Mock recent activity - in real app, this would come from activity logs */}
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-muted-foreground">New project created</span>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Task completed</span>
                <span className="text-xs text-muted-foreground">5 hours ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-muted-foreground">New member joined</span>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-muted-foreground">Workspace updated</span>
                <span className="text-xs text-muted-foreground">2 days ago</span>
              </div>
              
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm">
                  View all activity
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{invitation.invitedEmail}</div>
                    <div className="text-sm text-muted-foreground">
                      {mounted && (
                        <>
                          Invited {formatDistanceToNow(invitation.createdAt, { addSuffix: true })} • 
                          Expires {formatDistanceToNow(invitation.expiresAt, { addSuffix: true })}
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {invitation.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
