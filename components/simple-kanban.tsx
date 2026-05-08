"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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

export function SimpleKanban() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Hardcoded user and workspace IDs for testing
  const userId = "cmmj9tyi200005qsg35hdo4h2"
  const workspaceId = "cmos65rjl0001blr88qlpbjt5"

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading tasks...')
      const response = await fetch(`/api/tasks?userId=${userId}&workspaceId=${workspaceId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const tasksData = await response.json()
      console.log('Tasks loaded successfully:', tasksData)
      setTasks(tasksData)
    } catch (error) {
      console.error('Error loading tasks:', error)
      setError(error instanceof Error ? error.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const createTask = async () => {
    try {
      console.log('Creating new task...')
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title: `New Task ${Date.now()}`,
          description: 'This is a test task created from SimpleKanban',
          priority: 'Medium',
          status: 'new',
          workspaceId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const createdTask = await response.json()
      console.log('Task created successfully:', createdTask)
      setTasks(prev => [createdTask, ...prev])
    } catch (error) {
      console.error('Error creating task:', error)
      setError(error instanceof Error ? error.message : 'Failed to create task')
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      console.log('Updating task status:', taskId, 'to', newStatus)
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          updates: { status: newStatus }
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const updatedTask = await response.json()
      console.log('Task updated successfully:', updatedTask)
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ))
    } catch (error) {
      console.error('Error updating task:', error)
      setError(error instanceof Error ? error.message : 'Failed to update task')
    }
  }

  const columns = [
    { id: 'new', title: 'To Do', color: 'border-gray-300' },
    { id: 'processing', title: 'In Progress', color: 'border-blue-300' },
    { id: 'done', title: 'Done', color: 'border-green-300' },
    { id: 'urgent', title: 'Urgent', color: 'border-red-300' }
  ]

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center">Loading tasks...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center text-red-600">
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p className="mb-4">{error}</p>
          <Button onClick={loadTasks}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Simple Kanban Board</h1>
        <Button onClick={createTask}>Create Task</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {columns.map(column => (
          <Card key={column.id} className={`min-h-[400px] ${column.color}`}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {column.title}
                <Badge variant="secondary">
                  {tasks.filter(task => task.status === column.id).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tasks
                  .filter(task => task.status === column.id)
                  .map(task => (
                    <Card 
                      key={task.id} 
                      className="cursor-pointer hover:shadow-md transition-all hover:scale-105"
                      onClick={() => {
                        // Cycle through statuses
                        const statuses = ['new', 'processing', 'done', 'urgent']
                        const currentIndex = statuses.indexOf(task.status)
                        const nextStatus = statuses[(currentIndex + 1) % statuses.length]
                        updateTaskStatus(task.id, nextStatus)
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="font-medium text-sm">{task.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              task.priority === 'Urgent' ? 'border-red-300 text-red-700' :
                              task.priority === 'High' ? 'border-orange-300 text-orange-700' :
                              task.priority === 'Medium' ? 'border-yellow-300 text-yellow-700' :
                              'border-green-300 text-green-700'
                            }`}
                          >
                            {task.priority}
                          </Badge>
                          {task.dueDate && (
                            <span className="text-xs text-gray-500">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {task.description}
                          </div>
                        )}
                        {task.comments && task.comments > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            💬 {task.comments}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                
                {tasks.filter(task => task.status === column.id).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-sm">No tasks</div>
                    <div className="text-xs">Click "Create Task" to add one</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Debug Info</h2>
        <div className="bg-gray-100 p-2 rounded text-xs">
          <div>Total tasks: {tasks.length}</div>
          <div>User ID: {userId}</div>
          <div>Workspace ID: {workspaceId}</div>
          <div>Tasks by status:</div>
          <ul className="ml-4">
            {columns.map(column => (
              <li key={column.id}>
                {column.title}: {tasks.filter(task => task.status === column.id).length}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
