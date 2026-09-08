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

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!userId) {
        setProjects([])
        return
      }

      const currentUserId = userId
      const response = await fetch(`/api/projects?userId=${currentUserId}&industry=${industry || 'corporate'}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      
      const data = await response.json()
      setProjects(data || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [userId, industry])

  const addProject = useCallback(async (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (!userId) throw new Error('Authentication required')
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...project, userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to save project')
      }

      const savedProject = await response.json()
      setProjects(prev => [savedProject, ...prev])
    } catch (err) {
      console.error('Error adding project:', err)
      setError(err instanceof Error ? err.message : 'Failed to add project')
      throw err
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
      setError(err instanceof Error ? err.message : 'Failed to update project')
      throw err
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
      setError(err instanceof Error ? err.message : 'Failed to delete project')
      throw err
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
