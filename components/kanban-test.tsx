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

export function KanbanTest() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/tasks?userId=cmmj9tyi200005qsg35hdo4h2&workspaceId=cmos65rjl0001blr88qlpbjt5')
        if (response.ok) {
          const tasksData = await response.json()
          console.log('Tasks loaded:', tasksData)
          setTasks(tasksData)
        } else {
          console.error('Failed to load tasks')
        }
      } catch (error) {
        console.error('Error loading tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  const handleUpdateTask = async (taskId: string, updates: any) => {
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
        console.log('Task updated:', updatedTask)
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        ))
      } else {
        console.error('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleCreateTask = async () => {
    try {
      console.log('Creating new task')
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'cmmj9tyi200005qsg35hdo4h2',
          title: 'Test Task ' + Date.now(),
          description: 'This is a test task',
          priority: 'Medium',
          status: 'new',
          workspaceId: 'cmos65rjl0001blr88qlpbjt5',
        }),
      })

      if (response.ok) {
        const createdTask = await response.json()
        console.log('Task created:', createdTask)
        setTasks(prev => [createdTask, ...prev])
      } else {
        console.error('Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Kanban Test</h1>
      
      <Button onClick={handleCreateTask} className="mb-4">
        Create Test Task
      </Button>

      <div className="grid grid-cols-4 gap-4">
        {['new', 'processing', 'done', 'urgent'].map(status => (
          <Card key={status} className="min-h-[400px]">
            <CardHeader>
              <CardTitle className="capitalize">{status}</CardTitle>
              <Badge variant="secondary">
                {tasks.filter(t => t.status === status).length}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tasks
                  .filter(task => task.status === status)
                  .map(task => (
                    <Card 
                      key={task.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleUpdateTask(task.id, { status: status === 'new' ? 'processing' : 'done' })}
                    >
                      <CardContent className="p-3">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-gray-600">{task.priority}</div>
                        {task.dueDate && (
                          <div className="text-xs text-gray-500">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Debug Info</h2>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
          {JSON.stringify(tasks, null, 2)}
        </pre>
      </div>
    </div>
  )
}
