"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar, 
  Clock, 
  Flag, 
  User, 
  MessageSquare, 
  Paperclip, 
  CheckSquare,
  MoreHorizontal,
  Edit2,
  Trash2,
  UserPlus
} from "lucide-react"
import { useTasks, type Task, type TaskPriority, type TaskStatus } from "@/context/task-context"
import { useUser } from "@/context/user-context"
import { useWorkspace } from "@/context/workspace-context"
import { TaskComments } from "./task-comments"
import { TaskAttachments } from "./task-attachments"
import { TaskReactions } from "./task-reactions"
import { TaskSubtasks } from "./task-subtasks"
import { formatDistanceToNow } from "date-fns"

interface EnhancedTaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  className?: string
}

const priorityConfig: Record<TaskPriority, { color: string; label: string }> = {
  Low: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "Low" },
  Medium: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Medium" },
  High: { color: "bg-orange-100 text-orange-800 border-orange-200", label: "High" },
  Urgent: { color: "bg-red-100 text-red-800 border-red-200", label: "Urgent" },
}

const statusConfig: Record<TaskStatus, { color: string; label: string }> = {
  new: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "To Do" },
  processing: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "In Progress" },
  done: { color: "bg-green-100 text-green-800 border-green-200", label: "Done" },
  urgent: { color: "bg-red-100 text-red-800 border-red-200", label: "Urgent" },
}

export function EnhancedTaskCard({ task, onEdit, onDelete, className }: EnhancedTaskCardProps) {
  const { assignTask, unassignTask } = useTasks()
  const { userData } = useUser()
  const { members } = useWorkspace()
  
  const [showDetails, setShowDetails] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  const assignedMember = task.assignedTo ? members.find(m => m.userId === task.assignedTo) : null
  const canAssign = userData && members.some(m => m.userId === userData.id)
  const canEdit = userData && (userData.id === task.userId || canAssign)

  const handleAssign = async (memberId: string) => {
    try {
      await assignTask(task.id, memberId)
      setIsAssigning(false)
    } catch (error) {
      console.error('Failed to assign task:', error)
    }
  }

  const handleUnassign = async () => {
    try {
      await unassignTask(task.id)
    } catch (error) {
      console.error('Failed to unassign task:', error)
    }
  }

  return (
    <Card className={`transition-all hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold truncate">{task.title}</h3>
              {task.assignedTo && (
                <Badge variant="secondary" className="text-xs">
                  <User className="w-3 h-3 mr-1" />
                  Assigned
                </Badge>
              )}
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={statusConfig[task.status].color}>
                {statusConfig[task.status].label}
              </Badge>
              <Badge className={priorityConfig[task.priority].color}>
                <Flag className="w-3 h-3 mr-1" />
                {priorityConfig[task.priority].label}
              </Badge>
              {task.category && (
                <Badge variant="outline" className="text-xs">
                  {task.category}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {canEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit?.(task)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            {task.estimatedTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{task.estimatedTime}</span>
              </div>
            )}
          </div>

          {/* Assignment */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {assignedMember ? (
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={assignedMember.user?.avatar} />
                    <AvatarFallback className="text-xs">
                      {assignedMember.user?.fullName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{assignedMember.user?.fullName}</span>
                  {canAssign && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleUnassign}
                      className="h-6 w-6 p-0 text-muted-foreground"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserPlus className="w-4 h-4" />
                  <span>Unassigned</span>
                </div>
              )}
            </div>
            
            {canAssign && !assignedMember && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAssigning(true)}
                className="h-8"
              >
                Assign
              </Button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <TaskReactions taskId={task.id} />
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              <span>Comments</span>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Paperclip className="w-4 h-4" />
              <span>Files</span>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CheckSquare className="w-4 h-4" />
              <span>Subtasks</span>
            </div>
          </div>

          {/* Expanded Details */}
          {showDetails && (
            <div className="space-y-4 pt-4 border-t">
              <TaskComments taskId={task.id} />
              <TaskAttachments taskId={task.id} />
              <TaskSubtasks taskId={task.id} />
            </div>
          )}

          {/* Assignment Dropdown */}
          {isAssigning && (
            <div className="absolute top-full left-0 right-0 bg-background border rounded-lg shadow-lg p-2 z-10 mt-1">
              <div className="space-y-1">
                {members.filter(m => m.isActive).map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleAssign(member.userId)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded text-left"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={member.user?.avatar} />
                      <AvatarFallback className="text-xs">
                        {member.user?.fullName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{member.user?.fullName}</div>
                      <div className="text-xs text-muted-foreground">{member.user?.email}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsAssigning(false)}
                className="w-full p-2 text-sm text-muted-foreground hover:bg-muted rounded"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
