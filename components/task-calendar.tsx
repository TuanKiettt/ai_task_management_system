"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns"

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  assignedTo?: string
  user?: {
    id: string
    fullName: string
    avatar?: string
  }
  comments?: number
  attachments?: number
  subtasks?: {
    total: number
    completed: number
  }
  createdAt: string
}

interface TaskCalendarProps {
  tasks?: Task[]
  onTaskUpdate?: (taskId: string, updates: any) => void
  onTaskCreate?: (date: Date) => void
  onTaskEdit?: (task: Task) => void
  workspaceId?: string
}

const priorityColors = {
  Low: "bg-green-100 text-green-800 border-green-200",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200", 
  High: "bg-orange-100 text-orange-800 border-orange-200",
  Urgent: "bg-red-100 text-red-800 border-red-200"
}

const statusColors = {
  new: "bg-gray-100 text-gray-800",
  processing: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
  urgent: "bg-red-100 text-red-800"
}

export function TaskCalendar({ 
  tasks = [], 
  onTaskUpdate, 
  onTaskCreate, 
  onTaskEdit,
  workspaceId 
}: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = []
    let day = startDate

    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }, [startDate, endDate])

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return isSameDay(taskDate, date)
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    )
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    
    if (draggedTask) {
      const newDueDate = format(date, 'yyyy-MM-dd')
      onTaskUpdate?.(draggedTask.id, { dueDate: newDueDate })
      setDraggedTask(null)
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onTaskCreate?.(date)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Urgent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Low</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-7 gap-1 h-full">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            const dayTasks = getTasksForDate(date)
            const isCurrentMonth = isSameMonth(date, currentDate)
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const isTodayDate = isToday(date)
            const isOverdue = dayTasks.some(task => 
              task.status !== 'done' && new Date(task.dueDate!) < new Date()
            )

            return (
              <div
                key={index}
                className={`
                  border rounded-lg p-1 min-h-[100px] transition-all duration-200
                  ${!isCurrentMonth ? 'bg-gray-50 opacity-50' : 'bg-white'}
                  ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                  ${isTodayDate ? 'border-blue-500 border-2' : 'border-gray-200'}
                  ${isOverdue ? 'bg-red-50' : ''}
                  hover:shadow-md hover:border-blue-300
                `}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, date)}
                onClick={() => handleDateClick(date)}
              >
                {/* Date header */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`
                    text-sm font-medium
                    ${isTodayDate ? 'text-blue-600' : ''}
                    ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                  `}>
                    {format(date, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {dayTasks.length}
                    </Badge>
                  )}
                </div>

                {/* Tasks */}
                <div className="space-y-1 overflow-y-auto max-h-[70px]">
                  {dayTasks.slice(0, 3).map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onDragStart={() => handleDragStart(task)}
                      onEdit={() => onTaskEdit?.(task)}
                      compact={true}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Task Details Sidebar */}
      {selectedDate && (
        <div className="border-t p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">
              {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(null)}
            >
              ×
            </Button>
          </div>
          
          <div className="space-y-2">
            {getTasksForDate(selectedDate).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onDragStart={() => handleDragStart(task)}
                onEdit={() => onTaskEdit?.(task)}
                compact={false}
              />
            ))}
            
            {getTasksForDate(selectedDate).length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks for this date</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTaskCreate?.(selectedDate)}
                  className="mt-2"
                >
                  Add Task
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TaskCard({ 
  task, 
  onDragStart, 
  onEdit, 
  compact = false 
}: { 
  task: Task
  onDragStart: () => void
  onEdit: () => void
  compact: boolean
}) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
  
  if (compact) {
    return (
      <div
        draggable
        onDragStart={onDragStart}
        onClick={(e) => e.stopPropagation()}
        className={`
          cursor-move p-1 rounded border-l-2 text-xs
          ${priorityColors[task.priority as keyof typeof priorityColors]}
          ${task.status === 'done' ? 'opacity-50 line-through' : ''}
          ${isOverdue ? 'bg-red-50' : ''}
          hover:shadow-sm transition-all
        `}
      >
        <div className="truncate font-medium">{task.title}</div>
      </div>
    )
  }

  return (
    <Card 
      draggable
      onDragStart={onDragStart}
      onClick={(e) => e.stopPropagation()}
      className={`
        cursor-move transition-all hover:shadow-md
        ${task.status === 'done' ? 'opacity-50' : ''}
        ${isOverdue ? 'border-red-300 bg-red-50' : ''}
      `}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm truncate">{task.title}</h4>
          <div className="flex gap-1">
            <Badge 
              variant="outline" 
              className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}
            >
              {task.priority}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs ${statusColors[task.status as keyof typeof statusColors]}`}
            >
              {task.status}
            </Badge>
          </div>
        </div>
        
        {task.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          {task.user && (
            <div className="flex items-center gap-1">
              <Avatar className="w-4 h-4">
                <AvatarImage src={task.user.avatar} />
                <AvatarFallback className="text-xs">
                  {task.user.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-600">{task.user.fullName}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {task.comments && task.comments > 0 && (
              <span>💬 {task.comments}</span>
            )}
            {task.attachments && task.attachments > 0 && (
              <span>📎 {task.attachments}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
