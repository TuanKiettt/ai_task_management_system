"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  Calendar,
  Clock,
  User,
  MessageSquare,
  Paperclip,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { Task } from "./kanban-board"

interface KanbanTaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onStatusChange?: (taskId: string, newStatus: string) => void
  onDragStart?: (task: Task) => void
}

const priorityColors = {
  Low: "bg-green-100 text-green-800 border-green-200",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200", 
  High: "bg-orange-100 text-orange-800 border-orange-200",
  Urgent: "bg-red-100 text-red-800 border-red-200"
}

const statusIcons = {
  new: <Circle className="w-4 h-4" />,
  processing: <Clock className="w-4 h-4" />,
  done: <CheckCircle2 className="w-4 h-4" />,
  urgent: <AlertCircle className="w-4 h-4" />
}

export function KanbanTaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onDragStart
}: KanbanTaskCardProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    console.log('KanbanTaskCard: handleDragStart called for task:', task.id, task.status)
    setIsDragging(true)
    
    // Call parent onDragStart if provided
    if (onDragStart) {
      onDragStart(task)
    }
    
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.setData('taskStatus', task.status)
    e.dataTransfer.effectAllowed = 'move'
    
    console.log('KanbanTaskCard: Data set - taskId:', task.id, 'taskStatus:', task.status)
    
    // Create custom drag image
    const dragElement = e.currentTarget as HTMLElement
    const rect = dragElement.getBoundingClientRect()
    
    // Create a custom drag preview
    const dragPreview = document.createElement('div')
    dragPreview.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background: white;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      opacity: 0.9;
      z-index: 9999;
      pointer-events: none;
      transform: rotate(2deg);
      transition: transform 0.2s ease;
    `
    
    // Clone the card content
    dragPreview.innerHTML = dragElement.innerHTML
    document.body.appendChild(dragPreview)
    
    // Set drag image
    e.dataTransfer.setDragImage(dragPreview, rect.width / 2, rect.height / 2)
    
    // Remove preview after a delay
    setTimeout(() => {
      if (document.body.contains(dragPreview)) {
        document.body.removeChild(dragPreview)
      }
    }, 0)
    
    console.log('KanbanTaskCard: handleDragStart completed')
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
  const subtaskProgress = task.subtasks ? (task.subtasks.completed / task.subtasks.total) * 100 : 0

  return (
    <Card 
      className={`cursor-move transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 ${
        isDragging ? 'opacity-50 rotate-3 scale-95 shadow-2xl' : ''
      } ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {statusIcons[task.status as keyof typeof statusIcons] || <Circle className="w-4 h-4" />}
            <span className="text-sm font-medium truncate">{task.title}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
            {task.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Priority Badge */}
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}
          >
            {task.priority}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>

        {/* Subtasks Progress */}
        {task.subtasks && task.subtasks.total > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Subtasks</span>
              <span>{task.subtasks.completed}/{task.subtasks.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
              {format(new Date(task.dueDate), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        {/* Assigned User */}
        {task.assignedTo && task.user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={task.user.avatar} />
                <AvatarFallback className="text-xs">
                  {task.user.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600">{task.user.fullName}</span>
            </div>
          </div>
        )}

        {/* Activity Indicators */}
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {task.comments && task.comments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{task.comments}</span>
            </div>
          )}
          {task.attachments && task.attachments > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-4 h-4" />
              <span>{task.attachments}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
