"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"

export type TaskStatus = "new" | "processing" | "done" | "urgent"
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent"
export type RecurrencePattern = "daily" | "weekly" | "biweekly" | "monthly" | "custom"

export interface RecurrenceConfig {
  pattern: RecurrencePattern
  interval?: number // e.g., every 2 days
  daysOfWeek?: number[] // 0=Sun, 1=Mon, etc.
  dayOfMonth?: number
  endDate?: string
  occurrences?: number // max number of occurrences
}

export interface Task {
  id: string
  title: string
  description?: string
  category: string
  priority: TaskPriority
  status: TaskStatus
  estimatedTime?: string
  dueDate?: string
  createdAt: Date
  updatedAt: Date
  userId: string
}

interface TaskContextType {
  tasks: Task[]
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  completeTask: (id: string) => void
  getTasksByStatus: (status: TaskStatus) => Task[]
  getTasksByDate: (date: Date) => Task[]
  getTaskStats: () => { 
    total: number
    new: number
    processing: number
    done: number
    urgent: number
    overdue: number
  }
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

const defaultTasks: Task[] = []

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(defaultTasks)

  useEffect(() => {
    const savedTasks = localStorage.getItem("alba-tasks")
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks)
        const tasksWithDates = parsed.map((task: Task) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
        }))
        setTasks(tasksWithDates)
      } catch (error) {
        console.error("Failed to parse tasks:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("alba-tasks", JSON.stringify(tasks))
  }, [tasks])

  const addTask = useCallback(
    (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
      const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setTasks((prev) => [newTask, ...prev])
    },
    [],
  )

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task)),
    )
  }, [])

  // Complete a task - simple status update
  const completeTask = useCallback((id: string) => {
    updateTask(id, { status: "done" })
  }, [updateTask])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }, [])

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
    })
  }, [tasks])

  const contextValue = useMemo(
    () => ({
      tasks,
      addTask,
      updateTask,
      deleteTask,
      completeTask,
      getTasksByStatus,
      getTasksByDate,
      getTaskStats,
    }),
    [tasks, addTask, updateTask, deleteTask, completeTask, getTasksByStatus, getTasksByDate, getTaskStats],
  )

  return <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>
}

export const useTasks = () => {
  const context = useContext(TaskContext)
  if (!context) throw new Error("useTasks must be used within a TaskProvider")
  return context
}
