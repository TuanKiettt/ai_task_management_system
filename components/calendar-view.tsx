"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Plus, Clock, Repeat, MoreHorizontal, Search } from "lucide-react"
import { useTasks, type Task, type TaskPriority, type TaskStatus } from "@/context/task-context"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const priorityColors: Record<TaskPriority, string> = {
  Low: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-l-gray-400",
  Medium: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-blue-500",
  High: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-l-orange-500",
  Urgent: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-l-red-500",
}

export function CalendarView({ 
  workspaceTasks, 
  onTaskUpdate, 
  onTaskCreate,
  workspaceId 
}: { 
  workspaceTasks?: any[]
  onTaskUpdate?: (taskId: string, updates: any) => void
  onTaskCreate?: (task: any) => void
  workspaceId?: string
} = {}) {
  const { tasks: personalTasks, updateTask: updatePersonalTask, completeTask: completePersonalTask, deleteTask: deletePersonalTask, addTask: addPersonalTask } = useTasks()
  
  // Use workspace tasks if provided, otherwise use personal tasks
  const tasks = workspaceTasks || personalTasks
  const updateTask = onTaskUpdate || updatePersonalTask
  const completeTask = onTaskUpdate || completePersonalTask
  const deleteTask = onTaskUpdate || deletePersonalTask
  const addTask = onTaskCreate || addPersonalTask
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const days: { date: Date; isCurrentMonth: boolean }[] = []

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false })
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    // Next month padding (complete the grid to 42 days for 6 rows)
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return days
  }, [year, month])

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toLocaleDateString('en-CA') // Use local timezone
    const dayTasks = tasks.filter((task) => task.dueDate === dateStr)
    
    // Filter by search query if provided
    if (searchQuery.trim()) {
      return dayTasks.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return dayTasks
  }

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (date: Date) => {
    if (draggedTask) {
      const newDueDate = date.toLocaleDateString('en-CA') // Use local timezone
      updateTask(draggedTask.id, { dueDate: newDueDate })
      setDraggedTask(null)
    }
  }

  const handleAddTask = (date: string) => {
    if (!newTaskTitle.trim()) return

    addTask({
      title: newTaskTitle.trim(),
      category: "General",
      priority: "Medium",
      status: "new",
      estimatedTime: "1h",
      dueDate: date,
    })

    setNewTaskTitle("")
    setShowAddTask(false)
    setSelectedDate(null)
  }

  const todayStr = new Date().toLocaleDateString('en-CA') // en-CA gives YYYY-MM-DD format in local timezone

  return (
    <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-gray-200 dark:border-[#2d3548] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2d3548] flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToPrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={goToToday}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showSearch ? (
            <div className="relative">
              <CommandInput
                value={searchQuery}
                onValueChange={setSearchQuery}
                placeholder="Gõ lệnh hoặc hỏi Alba (Ctrl + K)..."
                className="h-10 w-64"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-6 w-6 p-0 text-muted-foreground hover:bg-accent/50"
                onClick={() => {
                  setShowSearch(false)
                  setSearchQuery("")
                }}
              >
                ×
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-accent/50 text-muted-foreground"
              onClick={() => setShowSearch(true)}
            >
              <Search className="w-4 h-4" />
            </Button>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Urgent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span> Low
            </span>
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-[#2d3548]">
        {DAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map(({ date, isCurrentMonth }, index) => {
          const dateStr = date.toLocaleDateString('en-CA') // Use local timezone
          const dayTasks = getTasksForDate(date)
          const isToday = dateStr === todayStr
          const isSelected = selectedDate === dateStr

          return (
            <div
              key={index}
              className={cn(
                "min-h-[80px] sm:min-h-[100px] p-1 border-b border-r border-gray-100 dark:border-[#2d3548] transition-colors",
                !isCurrentMonth && "bg-gray-50 dark:bg-[#13171f]",
                isSelected && "bg-violet-50 dark:bg-violet-900/20",
                "hover:bg-gray-50 dark:hover:bg-[#252b3b]"
              )}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(date)}
              onClick={() => setSelectedDate(dateStr)}
            >
              {/* Date number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "flex items-center justify-center w-7 h-7 text-sm rounded-full",
                    isToday && "bg-violet-600 text-white font-medium",
                    !isToday && isCurrentMonth && "text-gray-900 dark:text-gray-100",
                    !isCurrentMonth && "text-gray-400 dark:text-gray-600"
                  )}
                >
                  {date.getDate()}
                </span>
                {isCurrentMonth && (
                  <button
                    className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-[#2d3548] rounded transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedDate(dateStr)
                      setShowAddTask(true)
                    }}
                  >
                    <Plus className="w-3 h-3 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Tasks with summary */}
              <div className="space-y-1">
                {dayTasks.length > 0 && (
                  <div className="mb-1">
                    <TaskSummary tasks={dayTasks} />
                  </div>
                )}
                {dayTasks.slice(0, 3).map((task) => (
                  <TaskPill
                    key={task.id}
                    task={task}
                    onDragStart={() => handleDragStart(task)}
                    onComplete={() => completeTask(task.id, { status: 'done' })}
                    onDelete={() => deleteTask(task.id, {})}
                  />
                ))}
                {dayTasks.length > 3 && (
                  <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 pl-1">
                    +{dayTasks.length - 3} more
                  </button>
                )}
              </div>

              {/* Inline add task */}
              {showAddTask && selectedDate === dateStr && (
                <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTask(dateStr)
                      if (e.key === "Escape") {
                        setShowAddTask(false)
                        setNewTaskTitle("")
                      }
                    }}
                    placeholder="Task name..."
                    className="w-full text-xs px-2 py-1 bg-white dark:bg-[#252b3b] border border-violet-300 dark:border-violet-600 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
                    autoFocus
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TaskSummary({ tasks }: { tasks: Task[] }) {
  const completedTasks = tasks.filter(t => t.status === "done").length
  const totalTasks = tasks.length
  const urgentTasks = tasks.filter(t => t.priority === "Urgent" || t.status === "urgent").length
  
  if (totalTasks === 0) return null
  
  return (
    <div className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300 flex items-center justify-between">
      <span className="font-medium">
        {completedTasks}/{totalTasks} done
      </span>
      {urgentTasks > 0 && (
        <span className="text-red-500 font-medium">
          {urgentTasks} urgent
        </span>
      )}
    </div>
  )
}

function TaskPill({
  task,
  onDragStart,
  onComplete,
  onDelete,
}: {
  task: Task
  onDragStart: () => void
  onComplete: () => void
  onDelete: () => void
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        "group flex items-center gap-1 px-1.5 py-0.5 text-xs rounded border-l-2 cursor-grab active:cursor-grabbing",
        priorityColors[task.priority],
        task.status === "done" && "opacity-50 line-through"
      )}
    >
      <span className="truncate flex-1">{task.title}</span>
      <div className="hidden group-hover:flex items-center gap-0.5 relative">
        {task.isRecurring && (
          <Repeat className="w-3 h-3 text-violet-500" />
        )}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-32 p-1" 
            align="end"
            sideOffset={5}
          >
            <div className="py-1">
              {task.status !== "done" && (
                <button
                  onClick={onComplete}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  Mark complete
                </button>
              )}
              <button
                onClick={onDelete}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-red-600"
              >
                Delete
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
