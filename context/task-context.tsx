"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { useUser } from "./user-context"

export type TaskStatus = "new" | "processing" | "done" | "urgent"
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent"

export interface Task {
  id: string
  title: string
  description?: string
  category: string
  priority: TaskPriority
  status: TaskStatus
  estimatedTime?: string
  dueDate?: string
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
  userId: string
  isRecurring?: boolean
  workspaceId?: string
  assignedTo?: string
}

interface TaskContextType {
  tasks: Task[]
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "userId">) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  completeTask: (id: string) => Promise<void>
  assignTask: (taskId: string, assignedTo: string) => Promise<void>
  unassignTask: (taskId: string) => Promise<void>
  getTasksByStatus: (status: TaskStatus) => Task[]
  getTasksByDate: (date: Date) => Task[]
  getTasksAssignedTo: (userId: string) => Task[]
  getCompletionHistory: () => { date: string; completed: number }[]
  getTaskStats: () => { 
    total: number
    new: number
    processing: number
    done: number
    urgent: number
    overdue: number
    assigned: number
  }
  loading: boolean
  error: string | null
  refreshTasks: (workspaceId?: string) => Promise<void>
  addTaskToTimetable: (task: Task) => Promise<void> // Add task to calendar
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useUser()

  // Get current user ID from user context
  const getCurrentUserId = () => {
    return userId || "demo-user" // Fallback for demo purposes
  }

  // Fetch tasks from database
  const fetchTasks = useCallback(async (workspaceId?: string) => {
    try {
      setLoading(true)
      setError(null)
      const userId = getCurrentUserId()
      
      if (!userId) {
        console.error("No user ID available")
        setTasks([])
        return
      }
      
      let url = `/api/tasks?userId=${userId}`
      if (workspaceId) {
        url += `&workspaceId=${workspaceId}`
      }
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch tasks")
      }
      
      const tasksData = await response.json()
      
      // Convert date strings to Date objects
      const tasksWithDates = tasksData.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined,
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      }))
      
      setTasks(tasksWithDates)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Failed to fetch tasks:", err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Load tasks on mount
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const addTask = useCallback(async (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "userId">) => {
    if (!userId) {
      // Fallback: Add task to local state when no userId
      const localTask: Task = {
        id: crypto.randomUUID(),
        ...task,
        userId: 'local-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: task.status || 'new'
      }
      
      setTasks(prev => [localTask, ...prev])
      console.log('Task added to local state (no user ID):', localTask.title)
      return
    }

    try {
      setError(null)
      
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...task, userId }),
      })
      
      if (!response.ok) {
        // Fallback: Add to local state if API fails
        console.warn('API failed, adding task to local state')
        const localTask: Task = {
          id: crypto.randomUUID(),
          ...task,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: task.status || 'new'
        }
        
        setTasks(prev => [localTask, ...prev])
        return
      }
      
      // Refresh tasks after adding
      await fetchTasks()
    } catch (err) {
      // Fallback: Add to local state if error occurs
      console.warn('Error adding task, using local state:', err)
      const localTask: Task = {
        id: crypto.randomUUID(),
        ...task,
        userId: userId || 'local-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: task.status || 'new'
      }
      
      setTasks(prev => [localTask, ...prev])
      setError(null) // Clear error to not break UI
    }
  }, [userId, fetchTasks])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...updates, userId }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update task")
      }
      
      // Refresh tasks after updating
      await fetchTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task")
      console.error("Failed to update task:", err)
    }
  }, [fetchTasks])

  const deleteTask = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/tasks/${id}?userId=${userId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete task")
      }
      
      // Refresh tasks after deleting
      await fetchTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task")
      console.error("Failed to delete task:", err)
    }
  }, [fetchTasks])

  const completeTask = useCallback(async (id: string) => {
    await updateTask(id, { status: "done", completedAt: new Date() })
  }, [updateTask])

  const assignTask = useCallback(async (taskId: string, assignedTo: string) => {
    await updateTask(taskId, { assignedTo })
  }, [updateTask])

  const unassignTask = useCallback(async (taskId: string) => {
    await updateTask(taskId, { assignedTo: undefined })
  }, [updateTask])

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => {
      return tasks.filter((task) => task.status === status)
    },
    [tasks],
  )

  const getTasksByDate = useCallback(
    (date: Date) => {
      const dateStr = date.toISOString().split("T")[0]
      return tasks.filter((task) => task.dueDate === dateStr)
    },
    [tasks],
  )

  const getTasksAssignedTo = useCallback(
    (userId: string) => {
      return tasks.filter((task) => task.assignedTo === userId)
    },
    [tasks],
  )

  const getTaskStats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0]

    return () => ({
      total: tasks.length,
      new: tasks.filter((t) => t.status === "new").length,
      processing: tasks.filter((t) => t.status === "processing").length,
      done: tasks.filter((t) => t.status === "done").length,
      urgent: tasks.filter((t) => t.status === "urgent").length,
      overdue: tasks.filter(
        (t) => t.dueDate && t.dueDate < todayStr && t.status !== "done"
      ).length,
      assigned: tasks.filter((t) => t.assignedTo).length,
    })
  }, [tasks])

  const getCompletionHistory = useCallback(() => {
    // Group completed tasks by date
    const completedTasks = tasks.filter(task => task.status === "done")
    const history: { [key: string]: number } = {}
    
    completedTasks.forEach(task => {
      const date = task.updatedAt.toISOString().split('T')[0]
      history[date] = (history[date] || 0) + 1
    })
    
    // Convert to array and sort by date
    return Object.entries(history)
      .map(([date, completed]) => ({ date, completed }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [userId, fetchTasks])

  // Add task to timetable/calendar
  const addTaskToTimetable = useCallback(async (task: Task) => {
    try {
      setError(null)
      
      // For now, just log that we would add to timetable
      // TODO: Implement proper timetable integration when needed
      console.log('Task would be added to timetable:', task.title)
      
      // Optional: You could call a different API endpoint for tasks
      // const response = await fetch("/api/tasks/calendar", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ taskId: task.id }),
      // })
      
    } catch (err) {
      console.warn('Error with timetable integration:', err)
      // Don't set error as this is not critical functionality
    }
  }, [])

  const contextValue = useMemo(
    () => ({
      tasks,
      addTask,
      updateTask,
      deleteTask,
      completeTask,
      assignTask,
      unassignTask,
      getTasksByStatus,
      getTasksByDate,
      getTasksAssignedTo,
      getCompletionHistory,
      getTaskStats,
      loading,
      error,
      refreshTasks: fetchTasks,
      addTaskToTimetable,
    }),
    [tasks, addTask, updateTask, deleteTask, completeTask, assignTask, unassignTask, getTasksByStatus, getTasksByDate, getTasksAssignedTo, getCompletionHistory, getTaskStats, loading, error, fetchTasks, addTaskToTimetable],
  )

  return <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>
}

export const useTasks = () => {
  const context = useContext(TaskContext)
  if (!context) throw new Error("useTasks must be used within a TaskProvider")
  return context
}
