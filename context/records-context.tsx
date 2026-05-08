"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { useUser } from "./user-context"

export interface Record {
  id: string
  userId: string
  patient: string
  type: string
  date: string
  status: "Completed" | "Pending Review" | "In Progress"
  createdAt: Date
  updatedAt: Date
}

interface RecordsContextType {
  records: Record[]
  addRecord: (record: Omit<Record, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateRecord: (id: string, updates: Partial<Record>) => Promise<void>
  deleteRecord: (id: string) => Promise<void>
  getRecordStats: () => {
    total: number
    completed: number
    pending: number
    inProgress: number
  }
  loading: boolean
  error: string | null
  refreshRecords: () => Promise<void>
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined)

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useUser()

  const getCurrentUserId = () => {
    return userId || "demo-user"
  }

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const currentUserId = getCurrentUserId()
      const response = await fetch(`/api/records?userId=${currentUserId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch records')
      }
      
      const data = await response.json()
      setRecords(data || [])
    } catch (err) {
      console.error('Error fetching records:', err)
      setError(err instanceof Error ? err.message : 'Failed to load records')
      // Set fallback data for demo
      setRecords([
        {
          id: "1",
          userId: getCurrentUserId(),
          patient: "John Anderson",
          type: "Lab Results",
          date: "Jan 18, 2026",
          status: "Completed",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          userId: getCurrentUserId(),
          patient: "Maria Garcia",
          type: "X-Ray Report",
          date: "Jan 18, 2026",
          status: "Pending Review",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "3",
          userId: getCurrentUserId(),
          patient: "David Kim",
          type: "Prescription",
          date: "Jan 17, 2026",
          status: "Completed",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "4",
          userId: getCurrentUserId(),
          patient: "Sarah Johnson",
          type: "Surgery Notes",
          date: "Jan 18, 2026",
          status: "Completed",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "5",
          userId: getCurrentUserId(),
          patient: "Michael Brown",
          type: "Blood Test",
          date: "Jan 16, 2026",
          status: "In Progress",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [userId])

  const addRecord = useCallback(async (record: Omit<Record, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newRecord = {
        ...record,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRecord),
      })

      if (!response.ok) {
        throw new Error('Failed to save record')
      }

      const savedRecord = await response.json()
      setRecords(prev => [savedRecord, ...prev])
    } catch (err) {
      console.error('Error adding record:', err)
      // Fallback: add to local state
      const newRecord = {
        ...record,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setRecords(prev => [newRecord, ...prev])
    }
  }, [])

  const updateRecord = useCallback(async (id: string, updates: Partial<Record>) => {
    try {
      const updatedRecord = {
        ...updates,
        updatedAt: new Date(),
      }

      const response = await fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRecord),
      })

      if (!response.ok) {
        throw new Error('Failed to update record')
      }

      setRecords(prev => 
        prev.map(record => 
          record.id === id 
            ? { ...record, ...updatedRecord }
            : record
        )
      )
    } catch (err) {
      console.error('Error updating record:', err)
      // Fallback: update local state
      setRecords(prev => 
        prev.map(record => 
          record.id === id 
            ? { ...record, ...updates, updatedAt: new Date() }
            : record
        )
      )
    }
  }, [])

  const deleteRecord = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete record')
      }

      setRecords(prev => prev.filter(record => record.id !== id))
    } catch (err) {
      console.error('Error deleting record:', err)
      // Fallback: remove from local state
      setRecords(prev => prev.filter(record => record.id !== id))
    }
  }, [])

  const getRecordStats = useCallback(() => {
    const stats = {
      total: records.length,
      completed: records.filter(r => r.status === "Completed").length,
      pending: records.filter(r => r.status === "Pending Review").length,
      inProgress: records.filter(r => r.status === "In Progress").length,
    }
    return stats
  }, [records])

  const refreshRecords = useCallback(async () => {
    await fetchRecords()
  }, [fetchRecords])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const contextValue: RecordsContextType = useMemo(() => ({
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordStats,
    loading,
    error,
    refreshRecords,
  }), [records, addRecord, updateRecord, deleteRecord, getRecordStats, loading, error, refreshRecords])

  return (
    <RecordsContext.Provider value={contextValue}>
      {children}
    </RecordsContext.Provider>
  )
}

export function useRecords() {
  const context = useContext(RecordsContext)
  if (context === undefined) {
    throw new Error('useRecords must be used within a RecordsProvider')
  }
  return context
}
