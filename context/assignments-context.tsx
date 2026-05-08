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

  // Get current user ID from user context
  const getCurrentUserId = () => {
    return userId || "demo-user" // Fallback for demo purposes
  }

  // Fetch assignments from database
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const currentUserId = getCurrentUserId()
      const response = await fetch(`/api/assignments?userId=${currentUserId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignments')
      }
      
      const data = await response.json()
      setAssignments(data || [])
    } catch (err) {
      console.error('Error fetching assignments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load assignments')
      // Set fallback data for demo
      setAssignments([
        {
          id: "1",
          userId: getCurrentUserId(),
          title: "Research Paper: Climate Change",
          subject: "Science",
          dueDate: "Jan 28, 2026",
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          userId: getCurrentUserId(),
          title: "Math Problem Set 12",
          subject: "Mathematics",
          dueDate: "Jan 25, 2026",
          status: "submitted",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "3",
          userId: getCurrentUserId(),
          title: "Book Report: To Kill a Mockingbird",
          subject: "English",
          dueDate: "Jan 22, 2026",
          status: "graded",
          grade: "A",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "4",
          userId: getCurrentUserId(),
          title: "History Essay: World War II",
          subject: "History",
          dueDate: "Jan 20, 2026",
          status: "overdue",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "5",
          userId: getCurrentUserId(),
          title: "Lab Report: Chemical Reactions",
          subject: "Chemistry",
          dueDate: "Jan 30, 2026",
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Add new assignment
  const addAssignment = useCallback(async (assignment: Omit<Assignment, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newAssignment = {
        ...assignment,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Try to save to database
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAssignment),
      })

      if (!response.ok) {
        throw new Error('Failed to save assignment')
      }

      const savedAssignment = await response.json()
      setAssignments(prev => [savedAssignment, ...prev])
    } catch (err) {
      console.error('Error adding assignment:', err)
      // Fallback: add to local state
      const newAssignment = {
        ...assignment,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setAssignments(prev => [newAssignment, ...prev])
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
      // Fallback: update local state
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === id 
            ? { ...assignment, ...updates, updatedAt: new Date() }
            : assignment
        )
      )
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
      // Fallback: remove from local state
      setAssignments(prev => prev.filter(assignment => assignment.id !== id))
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
