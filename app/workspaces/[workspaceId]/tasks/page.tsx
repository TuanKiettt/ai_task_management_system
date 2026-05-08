'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWorkspace } from '@/context/workspace-context'
import { useUser } from '@/context/user-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Calendar, 
  CheckCircle, 
  Clock, 
  User,
  Filter,
  AlertCircle,
  Search,
  MoreHorizontal,
  LayoutGrid,
  List,
  ArrowLeft,
  BarChart3
} from 'lucide-react'
import { WorkspaceErrorBoundary } from '@/components/workspace-error-boundary'
import { KanbanBoard } from '@/components/kanban-board'
import { CalendarView } from '@/components/calendar-view'

interface Task {
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

export default function WorkspaceTasksPage() {
  const params = useParams()
  const router = useRouter()
  const { userId } = useUser()
  const { currentWorkspace } = useWorkspace()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('board')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'processing' | 'done' | 'urgent'>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | 'Low' | 'Medium' | 'High' | 'Urgent'>('all')

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    assignedTo: '',
    dueDate: ''
  })

  const workspaceId = params.workspaceId as string

  useEffect(() => {
    if (!workspaceId || !userId) return

    const loadTasks = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/tasks?userId=${userId}&workspaceId=${workspaceId}`)
        if (response.ok) {
          const tasksData = await response.json()
          setTasks(tasksData)
        } else {
          setError('Failed to fetch tasks')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tasks')
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [workspaceId, userId])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTask.title.trim()) return

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          status: 'new',
          workspaceId,
          assignedTo: newTask.assignedTo || undefined,
          dueDate: newTask.dueDate || undefined,
        }),
      })

      if (response.ok) {
        const createdTask = await response.json()
        setTasks(prev => [createdTask, ...prev])
        setNewTask({
          title: '',
          description: '',
          priority: 'Medium',
          assignedTo: '',
          dueDate: ''
        })
        setShowCreateForm(false)
      } else {
        setError('Failed to create task')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks(prev => prev.filter(task => task.id !== taskId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'new': return 'bg-gray-100 text-gray-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'done': return 'bg-green-100 text-green-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    )
  }

  <WorkspaceErrorBoundary 
    error={error}
    notFound={!currentWorkspace}
  />

  if (!currentWorkspace) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push(`/workspaces/${workspaceId}`)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Workspace
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentWorkspace.name} - Tasks
                </h1>
                <p className="text-sm text-gray-600">
                  Manage and track workspace tasks
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'board' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('board')}
                  className="px-3 py-1.5"
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Board
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-3 py-1.5"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="px-3 py-1.5"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
              </div>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 flex-shrink-0">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Total</p>
                  <p className="text-xl font-bold text-gray-900">{tasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">In Progress</p>
                  <p className="text-xl font-bold text-gray-900">
                    {tasks.filter(t => t.status === 'processing').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Completed</p>
                  <p className="text-xl font-bold text-gray-900">
                    {tasks.filter(t => t.status === 'done').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Overdue</p>
                  <p className="text-xl font-bold text-gray-900">
                    {tasks.filter(t => {
                      if (!t.dueDate) return false
                      return new Date(t.dueDate) < new Date() && t.status !== 'done'
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">To Do</SelectItem>
                  <SelectItem value="processing">In Progress</SelectItem>
                  <SelectItem value="done">Completed</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tasks View */}
        <div className="mt-6">
          {viewMode === 'board' ? (
            <KanbanBoard
              workspaceId={workspaceId}
              tasks={tasks}
              onTaskUpdate={async (taskId: string, updates: any) => {
                try {
                  console.log('Updating task:', taskId, updates)
                  const response = await fetch('/api/tasks', {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      taskId,
                      updates
                    }),
                  })

                  if (response.ok) {
                    const updatedTask = await response.json()
                    console.log('Task updated successfully:', updatedTask)
                    setTasks(prev => prev.map(task => 
                      task.id === taskId ? { ...task, ...updates } : task
                    ))
                  } else {
                    const errorData = await response.json()
                    console.error('Failed to update task:', errorData)
                    setError(`Failed to update task: ${errorData.error || 'Unknown error'}`)
                  }
                } catch (err) {
                  console.error('Error updating task:', err)
                  setError('Failed to update task')
                }
              }}
              onTaskCreate={() => setShowCreateForm(true)}
              onTaskEdit={(task) => {
                // TODO: Implement task edit modal
                console.log('Edit task:', task)
              }}
              onTaskDelete={(taskId) => handleDeleteTask(taskId)}
            />
        ) : viewMode === 'calendar' ? (
          <CalendarView
            workspaceTasks={tasks}
            workspaceId={workspaceId}
            onTaskUpdate={async (taskId: string, updates: any) => {
              try {
                console.log('Calendar: Updating task:', taskId, updates)
                const response = await fetch('/api/tasks', {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    taskId,
                    updates
                  }),
                })

                if (response.ok) {
                  const updatedTask = await response.json()
                  console.log('Calendar: Task updated successfully:', updatedTask)
                  setTasks(prev => prev.map(task => 
                    task.id === taskId ? { ...task, ...updates } : task
                  ))
                } else {
                  const errorData = await response.json()
                  console.error('Calendar: Failed to update task:', errorData)
                  setError(`Failed to update task: ${errorData.error || 'Unknown error'}`)
                }
              } catch (err) {
                console.error('Calendar: Error updating task:', err)
                setError('Failed to update task')
              }
            }}
            onTaskCreate={(task: any) => {
              // TODO: Implement task creation with due date
              console.log('Calendar: Create task:', task)
              setShowCreateForm(true)
            }}
          />
        ) : (
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </CardHeader>
            <CardContent>
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' 
                    ? 'No tasks found matching your filters'
                    : 'No tasks yet. Create your first task to get started.'
                  }
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium text-gray-900">{task.title}</h3>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {task.user?.fullName || 'Unassigned'}
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select 
                            value={task.status} 
                            onValueChange={(value: any) => handleUpdateTaskStatus(task.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">To Do</SelectItem>
                              <SelectItem value="processing">In Progress</SelectItem>
                              <SelectItem value="done">Completed</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Create New Task</span>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input
                    id="assignedTo"
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask(prev => ({ ...prev, assignedTo: e.target.value }))}
                    placeholder="Enter email or leave empty"
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )
        </div>
      )}
      </div>
    </div>
  )
}
