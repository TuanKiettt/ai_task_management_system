"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { 
  ChevronDown, ChevronRight, Plus, Filter, Search, Settings2,
  User, Calendar, Flag, MessageSquare, Circle, CheckCircle2, Loader2, AlertCircle, Edit
} from "lucide-react"
import { useTasks, type TaskStatus, type Task } from "@/context/task-context"
import { useWorkspace } from "@/context/workspace-context"
import { cn } from "@/lib/utils"
import { EditTaskModal } from "./edit-task-modal"

type GroupKey = TaskStatus

const statusConfig: Record<GroupKey, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  new: { label: "TO DO", icon: Circle, color: "text-gray-400", bgColor: "bg-gray-100 dark:bg-gray-800" },
  processing: { label: "IN PROGRESS", icon: Loader2, color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  urgent: { label: "URGENT", icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-900/30" },
  done: { label: "COMPLETE", icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" },
}

const priorityConfig: Record<string, { color: string }> = {
  Urgent: { color: "text-red-500" },
  High: { color: "text-orange-500" },
  Medium: { color: "text-yellow-500" },
  Low: { color: "text-gray-400" },
}

export function TodoList() {
  const { tasks, addTask, updateTask } = useTasks()
  const { workspaces } = useWorkspace()
  const [expandedGroups, setExpandedGroups] = useState<GroupKey[]>(["new", "processing", "urgent", "done"])
  const [addingToGroup, setAddingToGroup] = useState<GroupKey | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Function to get workspace display name
  const getWorkspaceDisplayName = (task: Task): string => {
    if (!task.workspaceId) {
      return "Individual"
    }
    
    const workspace = workspaces.find(w => w.id === task.workspaceId)
    return workspace ? workspace.name : "Unknown Workspace"
  }

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = []
    acc[task.status].push(task)
    return acc
  }, {} as Record<GroupKey, Task[]>)

  // Filter tasks based on search query
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredGroupedTasks = filteredTasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = []
    acc[task.status].push(task)
    return acc
  }, {} as Record<GroupKey, Task[]>)

  const toggleGroup = (group: GroupKey) => {
    setExpandedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    )
  }

  const handleAddTask = (status: GroupKey) => {
    if (!newTaskTitle.trim()) return
    addTask({
      title: newTaskTitle.trim(),
      category: "General",
      priority: status === "urgent" ? "Urgent" : "Medium",
      status,
      estimatedTime: "1h",
    })
    setNewTaskTitle("")
    setAddingToGroup(null)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingTask(null)
  }

  const cycleStatus = (task: Task) => {
    const order: TaskStatus[] = ["new", "processing", "done"]
    const currentIndex = order.indexOf(task.status === "urgent" ? "new" : task.status)
    const nextStatus = order[(currentIndex + 1) % order.length]
    updateTask(task.id, { status: nextStatus })
  }

  const statusOrder: GroupKey[] = ["new", "processing", "urgent", "done"]

  // Show search results count if searching
  const getSearchInfo = () => {
    if (searchQuery.trim()) {
      return (
        <div className="px-3 py-2 text-sm text-muted-foreground border-b border-border">
          Found {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} for "{searchQuery}"
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex-1 space-y-0">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 px-1 border-b border-border">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300">
            <Circle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Group:</span> Status
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hidden sm:flex">
            <Settings2 className="w-3.5 h-3.5" />
            Subtasks
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hidden sm:flex">
            <Settings2 className="w-3.5 h-3.5" />
            Columns
          </Button>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hidden md:flex">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Closed
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hidden md:flex">
            <User className="w-3.5 h-3.5" />
            Workspace
          </Button>
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
              className="h-8 w-8 hidden sm:flex hover:bg-accent/50 text-muted-foreground"
              onClick={() => setShowSearch(true)}
            >
              <Search className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hidden lg:flex">
            <Settings2 className="w-3.5 h-3.5" />
            Customize
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => {
              if (!expandedGroups.includes("new")) {
                setExpandedGroups(prev => [...prev, "new"])
              }
              setAddingToGroup("new")
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Task Groups */}
      <div className="divide-y divide-gray-100 dark:divide-[#2d3548]">
        {getSearchInfo()}
        {statusOrder.map((status) => {
          const config = statusConfig[status]
          const StatusIcon = config.icon
          const groupTasks = (searchQuery.trim() ? filteredGroupedTasks : groupedTasks)[status] || []
          const isExpanded = expandedGroups.includes(status)

          return (
            <div key={status} className="bg-card">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(status)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold", config.bgColor, config.color)}>
                  <StatusIcon className={cn("w-3.5 h-3.5", status === "processing" && "animate-spin")} />
                  {config.label}
                </div>
                <span className="text-xs text-gray-400 ml-1">{groupTasks.length}</span>
              </button>

              {isExpanded && (
                <>
                  {/* Table Header - hidden on mobile */}
                  <div className="hidden md:grid grid-cols-[1fr_80px_100px_70px_100px_60px_32px] gap-2 px-10 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                    <div>Name</div>
                    <div className="text-center">Workspace</div>
                    <div className="text-center">Due date</div>
                    <div className="text-center">Priority</div>
                    <div className="text-center">Status</div>
                    <div className="text-center">Comments</div>
                    <div></div>
                  </div>

                  {/* Task Rows */}
                  {groupTasks.map((task) => {
                    const taskConfig = statusConfig[task.status] || config
                    const TaskStatusIcon = taskConfig.icon
                    return (
                      <div
                        key={task.id}
                        className="flex md:grid md:grid-cols-[1fr_80px_100px_70px_100px_60px_32px] gap-2 px-3 py-2.5 items-center hover:bg-muted/50 transition-colors group border-b border-border/50"
                      >
                        {/* Name */}
                        <div className="flex items-center gap-2 pl-7 flex-1 min-w-0">
                          <button onClick={() => cycleStatus(task)} className="flex-shrink-0">
                            <TaskStatusIcon className={cn("w-4 h-4", taskConfig.color, task.status === "processing" && "animate-spin")} />
                          </button>
                          <span className={cn(
                            "text-sm truncate",
                            task.status === "done" ? "text-muted-foreground line-through" : "text-foreground"
                          )}>
                            {task.title}
                          </span>
                          {task.isRecurring && (
                            <span className="hidden sm:inline text-[10px] text-violet-500 bg-violet-100 dark:bg-violet-900/30 px-1 rounded shrink-0">↻</span>
                          )}
                          {/* Mobile: show due date inline */}
                          {task.dueDate && (
                            <span className="md:hidden text-[11px] text-muted-foreground ml-auto shrink-0">{task.dueDate}</span>
                          )}
                        </div>
                        {/* Workspace */}
                        <div className="hidden md:flex justify-center">
                          <span className="text-xs text-muted-foreground truncate max-w-[70px]">
                            {getWorkspaceDisplayName(task)}
                          </span>
                        </div>
                        {/* Due date */}
                        <div className="hidden md:flex justify-center">
                          <span className={cn(
                            "text-xs",
                            task.dueDate && task.dueDate < new Date().toISOString().split("T")[0] && task.status !== "done"
                              ? "text-red-500 font-medium"
                              : "text-muted-foreground"
                          )}>
                            {task.dueDate || <Calendar className="w-4 h-4 text-muted-foreground/30" />}
                          </span>
                        </div>
                        {/* Priority */}
                        <div className="hidden md:flex justify-center">
                          <Flag className={cn("w-4 h-4", priorityConfig[task.priority]?.color || "text-muted-foreground/30")} />
                        </div>
                        {/* Status Badge */}
                        <div className="hidden md:flex justify-center">
                          <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", taskConfig.bgColor, taskConfig.color)}>
                            <TaskStatusIcon className={cn("w-3 h-3", task.status === "processing" && "animate-spin")} />
                            <span className="hidden lg:inline">{taskConfig.label}</span>
                          </div>
                        </div>
                        {/* Comments */}
                        <div className="hidden md:flex justify-center">
                          <MessageSquare className="w-4 h-4 text-muted-foreground/30" />
                        </div>
                        {/* Edit */}
                        <div className="hidden md:flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditTask(task)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Edit task"
                          >
                            <Edit className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                        {/* Add col */}
                        <div className="hidden md:flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-4 h-4 text-muted-foreground/30" />
                        </div>
                      </div>
                    )
                  })}

                  {addingToGroup === status ? (
                    <div className="flex items-center gap-2 px-10 py-2 border-b border-border">
                      <StatusIcon className={cn("w-4 h-4", config.color)} />
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddTask(status)
                          if (e.key === "Escape") { setAddingToGroup(null); setNewTaskTitle("") }
                        }}
                        placeholder="Task name"
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" onClick={() => { setAddingToGroup(null); setNewTaskTitle("") }}>Cancel</Button>
                      <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => handleAddTask(status)}>Save</Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingToGroup(status)}
                      className="flex items-center gap-2 px-10 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full"
                    >
                      <Plus className="w-4 h-4" />
                      Add Task
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}

        {/* New Status Button */}
        <button className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full">
          <Plus className="w-4 h-4" />
          New status
        </button>
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
      />
    </div>
  )
}
