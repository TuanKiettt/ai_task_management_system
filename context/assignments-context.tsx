"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { useUser } from "./user-context"

export interface Assignment {
  id: string
  userId: string
  title: string
  subject: string
  dueDate: string
  status: "pending" | "submitted" | "graded" | "overdue"
  grade?: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

interface AssignmentsContextType {
  assignments: Assignment[]
  addAssignment: (assignment: Omit<Assignment, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>
  deleteAssignment: (id: string) => Promise<void>
  getAssignmentStats: () => {
    total: number
    pending: number
    submitted: number
    graded: number
    overdue: number
  }
  loading: boolean
  error: string | null
  refreshAssignments: () => Promise<void>
}

const AssignmentsContext = createContext<AssignmentsContextType | undefined>(undefined)

export function AssignmentsProvider({ children }: { children: React.ReactNode }) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useUser()

  // Fetch assignments from database
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!userId) {
        setAssignments([])
        return
      }

      const currentUserId = userId
      const response = await fetch(`/api/assignments?userId=${currentUserId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignments')
      }
      
      const data = await response.json()
      setAssignments(data || [])
    } catch (err) {
      console.error('Error fetching assignments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load assignments')
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Add new assignment
  const addAssignment = useCallback(async (assignment: Omit<Assignment, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (!userId) throw new Error('Authentication required')
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...assignment, userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to save assignment')
      }

      const savedAssignment = await response.json()
      setAssignments(prev => [savedAssignment, ...prev])
    } catch (err) {
      console.error('Error adding assignment:', err)
      setError(err instanceof Error ? err.message : 'Failed to add assignment')
      throw err
    }
  }, [])

  // Update assignment
  const updateAssignment = useCallback(async (id: string, updates: Partial<Assignment>) => {
    try {
      const updatedAssignment = {
        ...updates,
        updatedAt: new Date(),
      }

      // Try to update in database
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAssignment),
      })

      if (!response.ok) {
        throw new Error('Failed to update assignment')
      }

      // Update local state
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === id 
            ? { ...assignment, ...updatedAssignment }
            : assignment
        )
      )
    } catch (err) {
      console.error('Error updating assignment:', err)
      setError(err instanceof Error ? err.message : 'Failed to update assignment')
      throw err
    }
  }, [])

  // Delete assignment
  const deleteAssignment = useCallback(async (id: string) => {
    try {
      // Try to delete from database
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete assignment')
      }

      // Remove from local state
      setAssignments(prev => prev.filter(assignment => assignment.id !== id))
    } catch (err) {
      console.error('Error deleting assignment:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete assignment')
      throw err
    }
  }, [])

  // Get assignment statistics
  const getAssignmentStats = useCallback(() => {
    const stats = {
      total: assignments.length,
      pending: assignments.filter(a => a.status === "pending").length,
      submitted: assignments.filter(a => a.status === "submitted").length,
      graded: assignments.filter(a => a.status === "graded").length,
      overdue: assignments.filter(a => a.status === "overdue").length,
    }
    return stats
  }, [assignments])

  // Refresh assignments
  const refreshAssignments = useCallback(async () => {
    await fetchAssignments()
  }, [fetchAssignments])

  // Load assignments on component mount and when userId changes
  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const contextValue: AssignmentsContextType = useMemo(() => ({
    assignments,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentStats,
    loading,
    error,
    refreshAssignments,
  }), [assignments, addAssignment, updateAssignment, deleteAssignment, getAssignmentStats, loading, error, refreshAssignments])

  return (
    <AssignmentsContext.Provider value={contextValue}>
      {children}
    </AssignmentsContext.Provider>
  )
}

export function useAssignments() {
  const context = useContext(AssignmentsContext)
  if (context === undefined) {
    throw new Error('useAssignments must be used within an AssignmentsProvider')
  }
  return context
}
