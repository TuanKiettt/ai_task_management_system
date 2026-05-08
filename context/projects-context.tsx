"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { useUser } from "./user-context"

export interface Project {
  id: string
  userId: string
  workspaceId?: string
  name: string
  status: "In Progress" | "Planning" | "Review" | "Completed"
  progress: number
  team: number
  deadline: string
  createdAt: Date
  updatedAt: Date
}

interface ProjectsContextType {
  projects: Project[]
  addProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  getProjectStats: () => {
    total: number
    inProgress: number
    planning: number
    review: number
    completed: number
  }
  loading: boolean
  error: string | null
  refreshProjects: () => Promise<void>
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined)

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userId, industry } = useUser()

  const getCurrentUserId = () => {
    return userId || "demo-user"
  }

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const currentUserId = getCurrentUserId()
      const response = await fetch(`/api/projects?userId=${currentUserId}&industry=${industry || 'corporate'}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      
      const data = await response.json()
      setProjects(data || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
      // Set fallback data for demo
      const fallbackProjects = industry === "corporate" ? [
        {
          id: "1",
          userId: getCurrentUserId(),
          name: "Digital Transformation Initiative",
          status: "In Progress" as const,
          progress: 65,
          team: 8,
          deadline: "May 30, 2025",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { 
          id: "2", 
          userId: getCurrentUserId(),
          name: "Market Expansion Q2", 
          status: "Planning" as const, 
          progress: 25, 
          team: 5, 
          deadline: "Jun 15, 2025",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { 
          id: "3", 
          userId: getCurrentUserId(),
          name: "Product Launch Campaign", 
          status: "In Progress" as const, 
          progress: 80, 
          team: 12, 
          deadline: "May 20, 2025",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] : [
        { 
          id: "4", 
          userId: getCurrentUserId(),
          name: "Brand Identity Redesign", 
          status: "In Progress" as const, 
          progress: 70, 
          team: 4, 
          deadline: "May 25, 2025",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { 
          id: "5", 
          userId: getCurrentUserId(),
          name: "Social Media Campaign", 
          status: "Review" as const, 
          progress: 90, 
          team: 3, 
          deadline: "May 15, 2025",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { 
          id: "6", 
          userId: getCurrentUserId(),
          name: "Website Mockups", 
          status: "In Progress" as const, 
          progress: 45, 
          team: 2, 
          deadline: "Jun 1, 2025",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      setProjects(fallbackProjects)
    } finally {
      setLoading(false)
    }
  }, [userId, industry])

  const addProject = useCallback(async (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newProject = {
        ...project,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      })

      if (!response.ok) {
        throw new Error('Failed to save project')
      }

      const savedProject = await response.json()
      setProjects(prev => [savedProject, ...prev])
    } catch (err) {
      console.error('Error adding project:', err)
      // Fallback: add to local state
      const newProject = {
        ...project,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setProjects(prev => [newProject, ...prev])
    }
  }, [])

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      const updatedProject = {
        ...updates,
        updatedAt: new Date(),
      }

      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProject),
      })

      if (!response.ok) {
        throw new Error('Failed to update project')
      }

      setProjects(prev => 
        prev.map(project => 
          project.id === id 
            ? { ...project, ...updatedProject }
            : project
        )
      )
    } catch (err) {
      console.error('Error updating project:', err)
      // Fallback: update local state
      setProjects(prev => 
        prev.map(project => 
          project.id === id 
            ? { ...project, ...updates, updatedAt: new Date() }
            : project
        )
      )
    }
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete project')
      }

      setProjects(prev => prev.filter(project => project.id !== id))
    } catch (err) {
      console.error('Error deleting project:', err)
      // Fallback: remove from local state
      setProjects(prev => prev.filter(project => project.id !== id))
    }
  }, [])

  const getProjectStats = useCallback(() => {
    const stats = {
      total: projects.length,
      inProgress: projects.filter(p => p.status === "In Progress").length,
      planning: projects.filter(p => p.status === "Planning").length,
      review: projects.filter(p => p.status === "Review").length,
      completed: projects.filter(p => p.status === "Completed").length,
    }
    return stats
  }, [projects])

  const refreshProjects = useCallback(async () => {
    await fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const contextValue: ProjectsContextType = useMemo(() => ({
    projects,
    addProject,
    updateProject,
    deleteProject,
    getProjectStats,
    loading,
    error,
    refreshProjects,
  }), [projects, addProject, updateProject, deleteProject, getProjectStats, loading, error, refreshProjects])

  return (
    <ProjectsContext.Provider value={contextValue}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjects() {
  const context = useContext(ProjectsContext)
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider')
  }
  return context
}
