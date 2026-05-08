"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { useUser } from "./user-context"

export interface Subtask {
  id: string
  parentTaskId: string
  title: string
  completed: boolean
  position: number
  createdAt: Date
  updatedAt: Date
}

export interface ChecklistItem {
  id: string
  taskId: string
  title: string
  completed: boolean
  position: number
  createdAt: Date
}

interface SubtaskContextType {
  subtasks: Subtask[]
  checklistItems: ChecklistItem[]
  loading: boolean
  error: string | null
  
  // Subtask management
  createSubtask: (parentTaskId: string, title: string) => Promise<Subtask>
  updateSubtask: (subtaskId: string, updates: Partial<Subtask>) => Promise<Subtask>
  deleteSubtask: (subtaskId: string) => Promise<void>
  toggleSubtaskComplete: (subtaskId: string) => Promise<Subtask>
  reorderSubtasks: (parentTaskId: string, subtaskIds: string[]) => Promise<void>
  
  // Checklist management
  addChecklistItem: (taskId: string, title: string) => Promise<ChecklistItem>
  updateChecklistItem: (itemId: string, updates: Partial<ChecklistItem>) => Promise<ChecklistItem>
  deleteChecklistItem: (itemId: string) => Promise<void>
  toggleChecklistItem: (itemId: string) => Promise<ChecklistItem>
  reorderChecklistItems: (taskId: string, itemIds: string[]) => Promise<void>
  
  // Utility functions
  getSubtasksByTask: (parentTaskId: string) => Subtask[]
  getChecklistItemsByTask: (taskId: string) => ChecklistItem[]
  getSubtaskProgress: (parentTaskId: string) => { completed: number; total: number; percentage: number }
  getChecklistProgress: (taskId: string) => { completed: number; total: number; percentage: number }
  refreshSubtasks: (parentTaskId?: string) => Promise<void>
  refreshChecklistItems: (taskId?: string) => Promise<void>
}

const SubtaskContext = createContext<SubtaskContextType | undefined>(undefined)

export function SubtaskProvider({ children }: { children: React.ReactNode }) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useUser()

  const getCurrentUserId = () => {
    return userId || "demo-user"
  }

  // Fetch subtasks
  const fetchSubtasks = useCallback(async (parentTaskId?: string) => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      let url = `/api/subtasks?userId=${getCurrentUserId()}`
      if (parentTaskId) {
        url += `&parentTaskId=${parentTaskId}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch subtasks')
      }

      const subtasksData = await response.json()
      
      // Convert date strings to Date objects
      const subtasksWithDates = subtasksData.map((subtask: any) => ({
        ...subtask,
        createdAt: new Date(subtask.createdAt),
        updatedAt: new Date(subtask.updatedAt),
      }))

      if (parentTaskId) {
        // Replace subtasks for specific task
        setSubtasks(prev => [
          ...prev.filter(s => s.parentTaskId !== parentTaskId),
          ...subtasksWithDates
        ])
      } else {
        // Replace all subtasks
        setSubtasks(subtasksWithDates)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subtasks')
      console.error('Error fetching subtasks:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Fetch checklist items
  const fetchChecklistItems = useCallback(async (taskId?: string) => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      let url = `/api/checklist?userId=${getCurrentUserId()}`
      if (taskId) {
        url += `&taskId=${taskId}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch checklist items')
      }

      const checklistData = await response.json()
      
      // Convert date strings to Date objects
      const checklistWithDates = checklistData.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      }))

      if (taskId) {
        // Replace checklist items for specific task
        setChecklistItems(prev => [
          ...prev.filter(i => i.taskId !== taskId),
          ...checklistWithDates
        ])
      } else {
        // Replace all checklist items
        setChecklistItems(checklistWithDates)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch checklist items')
      console.error('Error fetching checklist items:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Create subtask
  const createSubtask = useCallback(async (parentTaskId: string, title: string) => {
    try {
      setError(null)

      // Get the next position
      const existingSubtasks = getSubtasksByTask(parentTaskId)
      const nextPosition = Math.max(...existingSubtasks.map(s => s.position), -1) + 1

      const response = await fetch('/api/subtasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentTaskId,
          title: title.trim(),
          position: nextPosition,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create subtask')
      }

      const newSubtask = await response.json()
      
      // Convert date strings to Date objects
      const subtaskWithDates = {
        ...newSubtask,
        createdAt: new Date(newSubtask.createdAt),
        updatedAt: new Date(newSubtask.updatedAt),
      }

      setSubtasks(prev => [subtaskWithDates, ...prev])
      return subtaskWithDates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subtask')
      console.error('Error creating subtask:', err)
      throw err
    }
  }, [])

  // Update subtask
  const updateSubtask = useCallback(async (subtaskId: string, updates: Partial<Subtask>) => {
    try {
      setError(null)

      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update subtask')
      }

      const updatedSubtask = await response.json()
      
      // Convert date strings to Date objects
      const subtaskWithDates = {
        ...updatedSubtask,
        createdAt: new Date(updatedSubtask.createdAt),
        updatedAt: new Date(updatedSubtask.updatedAt),
      }

      setSubtasks(prev => 
        prev.map(subtask => 
          subtask.id === subtaskId ? subtaskWithDates : subtask
        )
      )
      return subtaskWithDates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subtask')
      console.error('Error updating subtask:', err)
      throw err
    }
  }, [])

  // Delete subtask
  const deleteSubtask = useCallback(async (subtaskId: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete subtask')
      }

      setSubtasks(prev => prev.filter(subtask => subtask.id !== subtaskId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subtask')
      console.error('Error deleting subtask:', err)
      throw err
    }
  }, [])

  // Toggle subtask complete
  const toggleSubtaskComplete = useCallback(async (subtaskId: string) => {
    const subtask = subtasks.find(s => s.id === subtaskId)
    if (!subtask) return

    return await updateSubtask(subtaskId, { 
      completed: !subtask.completed,
      updatedAt: new Date()
    })
  }, [subtasks, updateSubtask])

  // Reorder subtasks
  const reorderSubtasks = useCallback(async (parentTaskId: string, subtaskIds: string[]) => {
    try {
      setError(null)

      const response = await fetch(`/api/subtasks/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentTaskId,
          subtaskIds,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder subtasks')
      }

      // Update local state
      setSubtasks(prev => {
        const taskSubtasks = prev.filter(s => s.parentTaskId === parentTaskId)
        const otherSubtasks = prev.filter(s => s.parentTaskId !== parentTaskId)
        
        const reorderedSubtasks = subtaskIds.map((id, index) => {
          const subtask = taskSubtasks.find(s => s.id === id)
          return subtask ? { ...subtask, position: index } : null
        }).filter(Boolean) as Subtask[]

        return [...otherSubtasks, ...reorderedSubtasks]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder subtasks')
      console.error('Error reordering subtasks:', err)
      throw err
    }
  }, [])

  // Add checklist item
  const addChecklistItem = useCallback(async (taskId: string, title: string) => {
    try {
      setError(null)

      // Get the next position
      const existingItems = getChecklistItemsByTask(taskId)
      const nextPosition = Math.max(...existingItems.map(i => i.position), -1) + 1

      const response = await fetch('/api/checklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          title: title.trim(),
          position: nextPosition,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add checklist item')
      }

      const newItem = await response.json()
      
      // Convert date strings to Date objects
      const itemWithDates = {
        ...newItem,
        createdAt: new Date(newItem.createdAt),
      }

      setChecklistItems(prev => [itemWithDates, ...prev])
      return itemWithDates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add checklist item')
      console.error('Error adding checklist item:', err)
      throw err
    }
  }, [])

  // Update checklist item
  const updateChecklistItem = useCallback(async (itemId: string, updates: Partial<ChecklistItem>) => {
    try {
      setError(null)

      const response = await fetch(`/api/checklist/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update checklist item')
      }

      const updatedItem = await response.json()
      
      // Convert date strings to Date objects
      const itemWithDates = {
        ...updatedItem,
        createdAt: new Date(updatedItem.createdAt),
      }

      setChecklistItems(prev => 
        prev.map(item => 
          item.id === itemId ? itemWithDates : item
        )
      )
      return itemWithDates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update checklist item')
      console.error('Error updating checklist item:', err)
      throw err
    }
  }, [])

  // Delete checklist item
  const deleteChecklistItem = useCallback(async (itemId: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/checklist/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete checklist item')
      }

      setChecklistItems(prev => prev.filter(item => item.id !== itemId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete checklist item')
      console.error('Error deleting checklist item:', err)
      throw err
    }
  }, [])

  // Toggle checklist item
  const toggleChecklistItem = useCallback(async (itemId: string) => {
    const item = checklistItems.find(i => i.id === itemId)
    if (!item) return

    return await updateChecklistItem(itemId, { 
      completed: !item.completed 
    })
  }, [checklistItems, updateChecklistItem])

  // Reorder checklist items
  const reorderChecklistItems = useCallback(async (taskId: string, itemIds: string[]) => {
    try {
      setError(null)

      const response = await fetch(`/api/checklist/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          itemIds,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder checklist items')
      }

      // Update local state
      setChecklistItems(prev => {
        const taskItems = prev.filter(i => i.taskId === taskId)
        const otherItems = prev.filter(i => i.taskId !== taskId)
        
        const reorderedItems = itemIds.map((id, index) => {
          const item = taskItems.find(i => i.id === id)
          return item ? { ...item, position: index } : null
        }).filter(Boolean) as ChecklistItem[]

        return [...otherItems, ...reorderedItems]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder checklist items')
      console.error('Error reordering checklist items:', err)
      throw err
    }
  }, [])

  // Get subtasks by task
  const getSubtasksByTask = useCallback((parentTaskId: string) => {
    return subtasks
      .filter(subtask => subtask.parentTaskId === parentTaskId)
      .sort((a, b) => a.position - b.position)
  }, [subtasks])

  // Get checklist items by task
  const getChecklistItemsByTask = useCallback((taskId: string) => {
    return checklistItems
      .filter(item => item.taskId === taskId)
      .sort((a, b) => a.position - b.position)
  }, [checklistItems])

  // Get subtask progress
  const getSubtaskProgress = useCallback((parentTaskId: string) => {
    const taskSubtasks = getSubtasksByTask(parentTaskId)
    const completed = taskSubtasks.filter(s => s.completed).length
    const total = taskSubtasks.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return { completed, total, percentage }
  }, [getSubtasksByTask])

  // Get checklist progress
  const getChecklistProgress = useCallback((taskId: string) => {
    const taskItems = getChecklistItemsByTask(taskId)
    const completed = taskItems.filter(i => i.completed).length
    const total = taskItems.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return { completed, total, percentage }
  }, [getChecklistItemsByTask])

  // Refresh functions
  const refreshSubtasks = useCallback(async (parentTaskId?: string) => {
    await fetchSubtasks(parentTaskId)
  }, [fetchSubtasks])

  const refreshChecklistItems = useCallback(async (taskId?: string) => {
    await fetchChecklistItems(taskId)
  }, [fetchChecklistItems])

  const contextValue: SubtaskContextType = useMemo(() => ({
    subtasks,
    checklistItems,
    loading,
    error,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    toggleSubtaskComplete,
    reorderSubtasks,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    toggleChecklistItem,
    reorderChecklistItems,
    getSubtasksByTask,
    getChecklistItemsByTask,
    getSubtaskProgress,
    getChecklistProgress,
    refreshSubtasks,
    refreshChecklistItems,
  }), [
    subtasks,
    checklistItems,
    loading,
    error,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    toggleSubtaskComplete,
    reorderSubtasks,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    toggleChecklistItem,
    reorderChecklistItems,
    getSubtasksByTask,
    getChecklistItemsByTask,
    getSubtaskProgress,
    getChecklistProgress,
    refreshSubtasks,
    refreshChecklistItems,
  ])

  return (
    <SubtaskContext.Provider value={contextValue}>
      {children}
    </SubtaskContext.Provider>
  )
}

export function useSubtasks() {
  const context = useContext(SubtaskContext)
  if (context === undefined) {
    throw new Error('useSubtasks must be used within a SubtaskProvider')
  }
  return context
}
