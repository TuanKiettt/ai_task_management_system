"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { useUser } from "./user-context"

export interface TimetableEntry {
  id: string
  userId: string
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string // "09:00"
  endTime: string // "10:00"
  subject: string
  location?: string
  color?: string
  taskId?: string // Link to task
  dueDate?: string // Due date for calendar display
  createdAt: Date
  updatedAt: Date
}

interface TimetableContextType {
  entries: TimetableEntry[]
  addEntry: (entry: Omit<TimetableEntry, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateEntry: (id: string, updates: Partial<TimetableEntry>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  getEntriesForDay: (dayOfWeek: number) => TimetableEntry[]
  getEntriesByWeek: () => Record<number, TimetableEntry[]>
  addTaskToTimetable: (task: any) => Promise<void> // Auto-add task to calendar
  loading: boolean
  error: string | null
  refreshEntries: () => Promise<void>
}

const TimetableContext = createContext<TimetableContextType | undefined>(undefined)

export function TimetableProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useUser()

  // Get current user ID from user context
  const getCurrentUserId = () => {
    return userId || "demo-user" // Fallback for demo purposes
  }

  // Fetch entries from database
  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const userId = getCurrentUserId()
      
      const response = await fetch(`/api/timetable?userId=${userId}`)
      if (!response.ok) {
        // Fallback to demo entries if API fails
        console.warn('API failed, using demo timetable entries')
        const demoEntries: TimetableEntry[] = [
          {
            id: "demo-api-fallback",
            userId: "demo-user",
            dayOfWeek: 1,
            startTime: "09:00",
            endTime: "10:00",
            subject: "Demo Session (API Unavailable)",
            location: "Virtual",
            color: "#6B7280",
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
        setEntries(demoEntries)
        setLoading(false)
        return
      }
      
      const entriesData = await response.json()
      
      // Convert date strings to Date objects
      const entriesWithDates = entriesData.map((entry: any) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
      }))
      
      setEntries(entriesWithDates)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Failed to fetch timetable entries:", err)
      
      // Fallback to demo entries on error
      const demoEntries: TimetableEntry[] = [
        {
          id: "demo-error-fallback",
          userId: "demo-user",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:00",
          subject: "Demo Mode (Connection Error)",
          location: "Offline",
          color: "#6B7280",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      setEntries(demoEntries)
      setError(null) // Clear error to not break UI
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Load entries on mount
  useEffect(() => {
    if (userId) {
      fetchEntries()
    } else {
      // Fallback: Show demo timetable when no user
      const demoEntries: TimetableEntry[] = [
        {
          id: "demo-1",
          userId: "demo-user",
          dayOfWeek: 1, // Monday
          startTime: "09:00",
          endTime: "10:30",
          subject: "AI Presentation Prep",
          location: "Conference Room A",
          color: "#3B82F6",
          taskId: "task-1",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "demo-2",
          userId: "demo-user",
          dayOfWeek: 1, // Monday
          startTime: "11:00",
          endTime: "12:00",
          subject: "Team Meeting",
          location: "Virtual",
          color: "#10B981",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "demo-3",
          userId: "demo-user",
          dayOfWeek: 2, // Tuesday
          startTime: "14:00",
          endTime: "16:00",
          subject: "Project Review",
          location: "Office",
          color: "#F59E0B",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "demo-4",
          userId: "demo-user",
          dayOfWeek: 3, // Wednesday
          startTime: "10:00",
          endTime: "11:30",
          subject: "Client Call",
          location: "Online",
          color: "#EF4444",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "demo-5",
          userId: "demo-user",
          dayOfWeek: 4, // Thursday
          startTime: "15:00",
          endTime: "17:00",
          subject: "Development Workshop",
          location: "Training Room",
          color: "#8B5CF6",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "demo-6",
          userId: "demo-user",
          dayOfWeek: 5, // Friday
          startTime: "09:30",
          endTime: "11:00",
          subject: "Sprint Planning",
          location: "Conference Room B",
          color: "#EC4899",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      setEntries(demoEntries)
      setLoading(false)
      console.log('Using demo timetable entries')
    }
  }, [fetchEntries, userId])

  const addEntry = useCallback(async (entry: Omit<TimetableEntry, "id" | "createdAt" | "updatedAt">) => {
    try {
      setError(null)
      
      const response = await fetch("/api/timetable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entry),
      })
      
      if (!response.ok) {
        // Fallback: Add to local state if API fails
        console.warn('API failed, adding entry to local state')
        const newEntry: TimetableEntry = {
          ...entry,
          id: `local-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        setEntries(prev => [...prev, newEntry])
        return
      }
      
      // Refresh entries after adding
      await fetchEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create timetable entry")
      console.error("Failed to add timetable entry:", err)
      
      // Fallback: Add to local state on error
      const newEntry: TimetableEntry = {
        ...entry,
        id: `error-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      setEntries(prev => [...prev, newEntry])
      setError(null) // Clear error to not break UI
    }
  }, [fetchEntries])

  const updateEntry = useCallback(async (id: string, updates: Partial<TimetableEntry>) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/timetable/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update timetable entry")
      }
      
      // Refresh entries after updating
      await fetchEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update timetable entry")
      console.error("Failed to update timetable entry:", err)
    }
  }, [fetchEntries])

  const deleteEntry = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/timetable/${id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete timetable entry")
      }
      
      // Refresh entries after deleting
      await fetchEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete timetable entry")
      console.error("Failed to delete timetable entry:", err)
    }
  }, [fetchEntries])

  const getEntriesForDay = useCallback(
    (dayOfWeek: number) => {
      return entries.filter((entry) => entry.dayOfWeek === dayOfWeek)
    },
    [entries],
  )

  // Auto-add task to calendar
  const addTaskToTimetable = useCallback(async (task: any) => {
    try {
      setLoading(true)
      setError(null)
      const userId = getCurrentUserId()
      
      // Create timetable entry from task
      const timetableEntry: Omit<TimetableEntry, "id" | "createdAt" | "updatedAt"> = {
        userId,
        dayOfWeek: new Date(task.dueDate || Date.now()).getDay(), // Use due date or today
        startTime: "09:00", // Default start time
        endTime: "10:00", // Default end time
        subject: task.title,
        location: "Task Management",
        color: task.priority === "Urgent" ? "#ef4444" : task.priority === "High" ? "#f59e0b" : "#3b82f6",
        taskId: task.id, // Link to original task
        dueDate: task.dueDate,
      }
      
      const response = await fetch('/api/timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timetableEntry),
      })
      
      if (!response.ok) {
        throw new Error("Failed to add task to timetable")
      }
      
      // Refresh entries after adding
      await fetchEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add task to timetable")
      console.error("Failed to add task to timetable:", err)
    } finally {
      setLoading(false)
    }
  }, [userId, fetchEntries])

  const getEntriesByWeek = useCallback(() => {
    const weekEntries: Record<number, TimetableEntry[]> = {}
    
    // Initialize all days (0-6)
    for (let i = 0; i <= 6; i++) {
      weekEntries[i] = []
    }
    
    // Group entries by day of week
    entries.forEach((entry) => {
      if (!weekEntries[entry.dayOfWeek]) {
        weekEntries[entry.dayOfWeek] = []
      }
      weekEntries[entry.dayOfWeek].push(entry)
    })
    
    // Sort entries by start time for each day
    Object.keys(weekEntries).forEach((day) => {
      weekEntries[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime))
    })
    
    return weekEntries
  }, [entries])

  const contextValue = useMemo(
    () => ({
      entries,
      addEntry,
      updateEntry,
      deleteEntry,
      getEntriesForDay,
      getEntriesByWeek,
      addTaskToTimetable,
      loading,
      error,
      refreshEntries: fetchEntries,
    }),
    [entries, addEntry, updateEntry, deleteEntry, getEntriesForDay, getEntriesByWeek, loading, error, fetchEntries]
  )

  return <TimetableContext.Provider value={contextValue}>{children}</TimetableContext.Provider>
}

export const useTimetable = () => {
  const context = useContext(TimetableContext)
  if (!context) throw new Error("useTimetable must be used within a TimetableProvider")
  return context
}
