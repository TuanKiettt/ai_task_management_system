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
  User, Calendar, Flag, MessageSquare, Circle, CheckCircle2, Loader2, AlertCircle, Edit,
  MoreVertical, X
} from "lucide-react"
import { useTasks, type TaskStatus, type Task } from "@/context/task-context"
import { useWorkspace } from "@/context/workspace-context"
import { cn } from "@/lib/utils"
import { EditTaskModal } from "./edit-task-modal"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

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

export function MobileOptimizedTodoList() {
  const { tasks, addTask, updateTask } = useTasks()
  const { workspaces } = useWorkspace()
  const [expandedGroups, setExpandedGroups] = useState<GroupKey[]>(["new", "processing", "urgent", "done"])
  const [addingToGroup, setAddingToGroup] = useState<GroupKey | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  // Function to get workspace display name
  const getWorkspaceDisplayName = (task: Task): string => {
    if (!task.workspaceId) {
      return "Individual"
    }
    
    const workspace = workspaces.find(w => w.id === task.workspaceId)
    return workspace ? workspace.name : "Unknown Workspace"
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === "all" || task.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const groupedTasks = filteredTasks.reduce((acc, task) => {
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

  const cycleStatus = (task: Task) => {
    const statusFlow: TaskStatus[] = ["new", "processing", "done"]
    const currentIndex = statusFlow.indexOf(task.status)
    const nextStatus = statusFlow[(currentIndex + 1) % statusFlow.length]
    updateTask(task.id, { status: nextStatus })
  }

  const TaskCard = ({ task }: { task: Task }) => {
    const taskConfig = statusConfig[task.status] || statusConfig.new
    const TaskStatusIcon = taskConfig.icon

    return (
      <div className="bg-card border border-border rounded-lg p-4 mb-3 active:scale-[0.98] transition-transform">
        {/* Task Header */}
        <div className="flex items-start gap-3 mb-3">
          <button 
            onClick={() => cycleStatus(task)} 
            className="flex-shrink-0 mt-1"
          >
            <TaskStatusIcon className={cn("w-5 h-5", taskConfig.color, task.status === "processing" && "animate-spin")} />
          </button>
          
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-medium text-base mb-1",
              task.status === "done" && "text-muted-foreground line-through"
            )}>
              {task.title}
            </h3>
            
            {/* Task Meta */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {task.isRecurring && (
                <Badge variant="secondary" className="text-[10px]">
                  ↻ Recurring
                </Badge>
              )}
              
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {getWorkspaceDisplayName(task)}
              </span>
              
              {task.dueDate && (
                <span className={cn(
                  "flex items-center gap-1",
                  task.dueDate < new Date().toISOString().split('T')[0] && task.status !== 'done' && "text-red-500 font-medium"
                )}>
                  <Calendar className="w-3 h-3" />
                  {task.dueDate}
                </span>
              )}
              
              <span className="flex items-center gap-1">
                <Flag className={cn("w-3 h-3", priorityConfig[task.priority]?.color)} />
                {task.priority}
              </span>
            </div>
          </div>

          {/* Task Actions */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[40vh]">
              <SheetHeader>
                <SheetTitle>Task Actions</SheetTitle>
              </SheetHeader>
              <div className="space-y-2 mt-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => handleEditTask(task)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Task
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => cycleStatus(task)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Change Status
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={() => updateTask(task.id, { status: 'done' })}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Task Description */}
        {task.description && (
          <p className="text-sm text-muted-foreground ml-8 mb-2 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Task Footer */}
        <div className="flex items-center justify-between ml-8">
          <span className="text-xs text-muted-foreground">
            Created {new Date(task.createdAt).toLocaleDateString()}
          </span>
          
          {task.estimatedTime && (
            <Badge variant="outline" className="text-xs">
              {task.estimatedTime}
            </Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Tasks</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8 w-8 p-0"
              >
                <Filter className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
                className="h-8 w-8 p-0"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Filter Pills */}
          {showFilters && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {["all", "new", "processing", "urgent", "done"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className="whitespace-nowrap"
                >
                  {status === "all" ? "All" : statusConfig[status as GroupKey]?.label}
                </Button>
              ))}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-muted rounded-lg p-2">
              <div className="text-lg font-bold">{filteredTasks.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="bg-muted rounded-lg p-2">
              <div className="text-lg font-bold text-blue-500">
                {filteredTasks.filter(t => t.status === 'processing').length}
              </div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="bg-muted rounded-lg p-2">
              <div className="text-lg font-bold text-red-500">
                {filteredTasks.filter(t => t.status === 'urgent').length}
              </div>
              <div className="text-xs text-muted-foreground">Urgent</div>
            </div>
            <div className="bg-muted rounded-lg p-2">
              <div className="text-lg font-bold text-green-500">
                {filteredTasks.filter(t => t.status === 'done').length}
              </div>
              <div className="text-xs text-muted-foreground">Done</div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Groups */}
      <div className="p-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const groupTasks = groupedTasks[status as GroupKey] || []
          const isExpanded = expandedGroups.includes(status as GroupKey)
          const StatusIcon = config.icon

          return (
            <div key={status} className="mb-6">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(status as GroupKey)}
                className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-lg mb-3 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <StatusIcon className={cn("w-5 h-5", config.color)} />
                  <div className="text-left">
                    <h2 className="font-semibold">{config.label}</h2>
                    <p className="text-xs text-muted-foreground">{groupTasks.length} tasks</p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setAddingToGroup(status as GroupKey)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </button>

              {/* Add Task Form */}
              {addingToGroup === status && (
                <div className="mb-3 p-3 bg-muted border border-border rounded-lg">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a new task..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTask(status as GroupKey)
                        } else if (e.key === 'Escape') {
                          setAddingToGroup(null)
                          setNewTaskTitle("")
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddTask(status as GroupKey)}
                      disabled={!newTaskTitle.trim()}
                    >
                      Add
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAddingToGroup(null)
                        setNewTaskTitle("")
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Tasks */}
              {isExpanded && (
                <div>
                  {groupTasks.length > 0 ? (
                    groupTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <StatusIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No tasks in {config.label}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingTask(null)
          }}
        />
      )}
    </div>
  )
}
