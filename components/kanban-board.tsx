"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Plus,
  MoreHorizontal,
  Filter,
  Search,
  LayoutGrid,
  List,
  Calendar
} from "lucide-react"
import { KanbanTaskCard } from "./kanban-task-card"

// Export Task type to be used across the project
export type Task = {
  id: string
  title: string
  description?: string
  status: 'new' | 'processing' | 'done' | 'urgent'
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  assignedTo?: string
  dueDate?: string
  createdAt: string
  workspaceId?: string
  createdBy?: string
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
}

interface KanbanColumn {
  id: string
  title: string
  status: 'new' | 'processing' | 'done' | 'urgent'
  color: string
  tasks: Task[]
}

interface KanbanBoardProps {
  workspaceId?: string
  tasks?: Task[]
  onTaskUpdate?: (taskId: string, updates: any) => void
  onTaskCreate?: () => void
  onTaskEdit?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
}

const defaultColumns: KanbanColumn[] = [
  {
    id: 'new',
    title: 'To Do',
    status: 'new',
    color: 'border-gray-300',
    tasks: []
  },
  {
    id: 'processing',
    title: 'In Progress',
    status: 'processing',
    color: 'border-blue-300',
    tasks: []
  },
  {
    id: 'done',
    title: 'Done',
    status: 'done',
    color: 'border-green-300',
    tasks: []
  },
  {
    id: 'urgent',
    title: 'Urgent',
    status: 'urgent',
    color: 'border-red-300',
    tasks: []
  }
]

export function KanbanBoard({ 
  workspaceId, 
  tasks: initialTasks = [], 
  onTaskUpdate, 
  onTaskCreate, 
  onTaskEdit, 
  onTaskDelete 
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>(defaultColumns)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  // Initialize columns with tasks
  useEffect(() => {
    const newColumns = defaultColumns.map(column => ({
      ...column,
      tasks: initialTasks.filter(task => task.status === column.status)
    }))
    setColumns(newColumns)
  }, [initialTasks])

  const handleDragStart = (task: Task) => {
    console.log('KanbanBoard: handleDragStart called with task:', task)
    setDraggedTask(task)
    console.log('KanbanBoard: draggedTask set to:', task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the column
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetColumn: KanbanColumn) => {
    console.log('KanbanBoard: handleDrop called')
    console.log('KanbanBoard: draggedTask:', draggedTask)
    console.log('KanbanBoard: targetColumn:', targetColumn)
    
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedTask || draggedTask.status === targetColumn.status) {
      console.log('KanbanBoard: Early return - no draggedTask or same status')
      return
    }

    console.log('KanbanBoard: Processing drop from', draggedTask.status, 'to', targetColumn.status)

    // Add visual feedback animation
    const dropZone = e.currentTarget as HTMLElement
    dropZone.style.transition = 'all 0.3s ease'
    dropZone.style.transform = 'scale(1.02)'
    
    setTimeout(() => {
      dropZone.style.transform = 'scale(1)'
    }, 200)

    // Update task status
    const updatedTask = { ...draggedTask, status: targetColumn.status }
    
    // Update columns with animation
    const newColumns = columns.map(column => {
      if (column.id === draggedTask.status) {
        return {
          ...column,
          tasks: column.tasks.filter(task => task.id !== draggedTask.id)
        }
      }
      if (column.id === targetColumn.id) {
        return {
          ...column,
          tasks: [...column.tasks, updatedTask]
        }
      }
      return column
    })

    console.log('KanbanBoard: Updating columns')
    setColumns(newColumns)
    
    console.log('KanbanBoard: Calling onTaskUpdate with:', draggedTask.id, { status: targetColumn.status })
    onTaskUpdate?.(draggedTask.id, { status: targetColumn.status })
    
    console.log('KanbanBoard: Setting draggedTask to null')
    setDraggedTask(null)
    
    console.log('KanbanBoard: handleDrop completed')
  }

  const filteredTasks = (tasks: Task[]) => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
      return matchesSearch && matchesPriority
    })
  }

  const getTaskCount = (column: KanbanColumn) => {
    return filteredTasks(column.tasks).length
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Kanban Board</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <LayoutGrid className="w-4 h-4 mr-2" />
            Board
          </Button>
          <Button variant="ghost" size="sm">
            <List className="w-4 h-4 mr-2" />
            List
          </Button>
          <Button variant="ghost" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </Button>
          <Button onClick={onTaskCreate} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="flex gap-4 overflow-x-auto">
            {columns.map((column) => (
              <div
                key={column.id}
                className={`flex-shrink-0 w-80 min-w-[300px] max-w-[400px]`}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column)}
              >
                <Card className={`h-full transition-all duration-300 ${column.color} ${
                  dragOverColumn === column.id 
                    ? 'ring-2 ring-blue-400 bg-blue-50 scale-105' 
                    : 'hover:shadow-md'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{column.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {getTaskCount(column)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 min-h-[400px]">
                      {filteredTasks(column.tasks).map((task) => (
                        <KanbanTaskCard
                          key={task.id}
                          task={task}
                          onEdit={onTaskEdit}
                          onDelete={onTaskDelete}
                          onStatusChange={(taskId, newStatus) => {
                            // This is handled by drag and drop, but we keep it for other interactions
                          }}
                          onDragStart={handleDragStart}
                        />
                      ))}
                      {getTaskCount(column) === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-sm">No tasks in this column</div>
                          <div className="text-xs mt-1">Drag tasks here to add them</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
