"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { useUser } from "./user-context"

export type CourseStatus = "completed" | "in-progress" | "assigned" | "recommended"

export interface Course {
  id: string
  title: string
  category: string
  progress: number
  duration: string
  status: CourseStatus
  createdAt: Date
  updatedAt: Date
  userId: string
}

interface LearningContextType {
  courses: Course[]
  addCourse: (course: Omit<Course, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>
  deleteCourse: (id: string) => Promise<void>
  startCourse: (id: string) => Promise<void>
  getCoursesByStatus: (status: CourseStatus) => Course[]
  getCourseStats: () => { 
    total: number
    completed: number
    inProgress: number
    assigned: number
    recommended: number
  }
  loading: boolean
  error: string | null
  refreshCourses: () => Promise<void>
}

const LearningContext = createContext<LearningContextType | undefined>(undefined)

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useUser()

  // Get current user ID from user context
  const getCurrentUserId = () => {
    return userId || "demo-user" // Fallback for demo purposes
  }

  // Fetch courses from database
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const userId = getCurrentUserId()
      
      const response = await fetch(`/api/courses?userId=${userId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch courses")
      }
      
      const coursesData = await response.json()
      
      // Convert date strings to Date objects
      const coursesWithDates = coursesData.map((course: any) => ({
        ...course,
        createdAt: new Date(course.createdAt),
        updatedAt: new Date(course.updatedAt),
      }))
      
      setCourses(coursesWithDates)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Failed to fetch courses:", err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Load courses on mount
  useEffect(() => {
    if (userId) {
      fetchCourses()
    } else {
      setLoading(false)
    }
  }, [fetchCourses, userId])

  const addCourse = useCallback(async (course: Omit<Course, "id" | "createdAt" | "updatedAt">) => {
    try {
      setError(null)
      
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(course),
      })
      
      if (!response.ok) {
        throw new Error("Failed to create course")
      }
      
      // Refresh courses after adding
      await fetchCourses()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course")
      console.error("Failed to add course:", err)
    }
  }, [fetchCourses])

  const updateCourse = useCallback(async (id: string, updates: Partial<Course>) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update course")
      }
      
      // Refresh courses after updating
      await fetchCourses()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update course")
      console.error("Failed to update course:", err)
    }
  }, [fetchCourses])

  const deleteCourse = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete course")
      }
      
      // Refresh courses after deleting
      await fetchCourses()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course")
      console.error("Failed to delete course:", err)
    }
  }, [fetchCourses])

  const startCourse = useCallback(async (id: string) => {
    const course = courses.find(c => c.id === id)
    if (!course) return

    await updateCourse(id, { 
      status: "in-progress", 
      progress: Math.max(course.progress, 10) 
    })
  }, [courses, updateCourse])

  const getCoursesByStatus = useCallback(
    (status: CourseStatus) => {
      return courses.filter((course) => course.status === status)
    },
    [courses],
  )

  const getCourseStats = useMemo(() => {
    return () => ({
      total: courses.length,
      completed: courses.filter((c) => c.status === "completed").length,
      inProgress: courses.filter((c) => c.status === "in-progress").length,
      assigned: courses.filter((c) => c.status === "assigned").length,
      recommended: courses.filter((c) => c.status === "recommended").length,
    })
  }, [courses])

  const contextValue = useMemo(
    () => ({
      courses,
      addCourse,
      updateCourse,
      deleteCourse,
      startCourse,
      getCoursesByStatus,
      getCourseStats,
      loading,
      error,
      refreshCourses: fetchCourses,
    }),
    [courses, addCourse, updateCourse, deleteCourse, startCourse, getCoursesByStatus, getCourseStats, loading, error, fetchCourses],
  )

  return <LearningContext.Provider value={contextValue}>{children}</LearningContext.Provider>
}

export const useLearning = () => {
  const context = useContext(LearningContext)
  if (!context) throw new Error("useLearning must be used within a LearningProvider")
  return context
}
