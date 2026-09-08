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

  // Fetch entries from database
  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      if (!userId) {
        setEntries([])
        return
      }
      
      const response = await fetch(`/api/timetable?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch timetable entries')
      
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
      
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Load entries on mount
  useEffect(() => {
    fetchEntries()
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
      
      if (!response.ok) throw new Error('Failed to create timetable entry')
      
      // Refresh entries after adding
      await fetchEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create timetable entry")
      console.error("Failed to add timetable entry:", err)
      
      throw err
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
      if (!userId) throw new Error('Authentication required')
      
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
