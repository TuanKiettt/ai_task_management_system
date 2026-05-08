"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { useUser } from "./user-context"

export interface Reaction {
  id: string
  taskId: string
  userId: string
  emoji: string
  createdAt: Date
  user?: {
    id: string
    fullName: string
    email: string
    avatar?: string
  }
}

interface ReactionContextType {
  reactions: Reaction[]
  loading: boolean
  error: string | null
  
  // Reaction management
  addReaction: (taskId: string, emoji: string) => Promise<Reaction>
  removeReaction: (taskId: string, emoji: string) => Promise<void>
  
  // Utility functions
  getReactionsByTask: (taskId: string) => Reaction[]
  getTaskReactionCounts: (taskId: string) => Record<string, number>
  getUserReaction: (taskId: string) => Reaction | null
  refreshReactions: (taskId?: string) => Promise<void>
  
  // Common emojis
  commonEmojis: string[]
}

const COMMON_EMOJIS = ["👍", "❤️", "😊", "🎉", "🔥", "💯", "👏", "🚀", "😂", "🤔", "👀", "💪"]

const ReactionContext = createContext<ReactionContextType | undefined>(undefined)

export function ReactionProvider({ children }: { children: React.ReactNode }) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useUser()

  const getCurrentUserId = () => {
    return userId || "demo-user"
  }

  // Fetch reactions for a task
  const fetchReactions = useCallback(async (taskId?: string) => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      let url = `/api/reactions?userId=${getCurrentUserId()}`
      if (taskId) {
        url += `&taskId=${taskId}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch reactions')
      }

      const reactionsData = await response.json()
      
      // Convert date strings to Date objects
      const reactionsWithDates = reactionsData.map((reaction: any) => ({
        ...reaction,
        createdAt: new Date(reaction.createdAt),
      }))

      if (taskId) {
        // Replace reactions for specific task
        setReactions(prev => [
          ...prev.filter(r => r.taskId !== taskId),
          ...reactionsWithDates
        ])
      } else {
        // Replace all reactions
        setReactions(reactionsWithDates)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reactions')
      console.error('Error fetching reactions:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Add reaction
  const addReaction = useCallback(async (taskId: string, emoji: string) => {
    try {
      setError(null)

      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          userId: getCurrentUserId(),
          emoji,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 409) {
          // User already reacted with this emoji
          throw new Error('You have already reacted with this emoji')
        }
        throw new Error(errorData.error || 'Failed to add reaction')
      }

      const newReaction = await response.json()
      
      // Convert date strings to Date objects
      const reactionWithDates = {
        ...newReaction,
        createdAt: new Date(newReaction.createdAt),
      }

      setReactions(prev => [reactionWithDates, ...prev])
      return reactionWithDates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reaction')
      console.error('Error adding reaction:', err)
      throw err
    }
  }, [])

  // Remove reaction
  const removeReaction = useCallback(async (taskId: string, emoji: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/reactions/${taskId}/${emoji}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove reaction')
      }

      // Remove reaction from state
      setReactions(prev => 
        prev.filter(reaction => 
          !(reaction.taskId === taskId && 
            reaction.emoji === emoji && 
            reaction.userId === getCurrentUserId())
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove reaction')
      console.error('Error removing reaction:', err)
      throw err
    }
  }, [])

  // Get reactions by task
  const getReactionsByTask = useCallback((taskId: string) => {
    return reactions.filter(reaction => reaction.taskId === taskId)
  }, [reactions])

  // Get reaction counts for a task
  const getTaskReactionCounts = useCallback((taskId: string) => {
    const taskReactions = getReactionsByTask(taskId)
    const counts: Record<string, number> = {}
    
    taskReactions.forEach(reaction => {
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1
    })
    
    return counts
  }, [getReactionsByTask])

  // Get user's reaction for a task
  const getUserReaction = useCallback((taskId: string) => {
    return reactions.find(reaction => 
      reaction.taskId === taskId && 
      reaction.userId === getCurrentUserId()
    ) || null
  }, [reactions])

  // Refresh reactions
  const refreshReactions = useCallback(async (taskId?: string) => {
    await fetchReactions(taskId)
  }, [fetchReactions])

  const contextValue: ReactionContextType = useMemo(() => ({
    reactions,
    loading,
    error,
    addReaction,
    removeReaction,
    getReactionsByTask,
    getTaskReactionCounts,
    getUserReaction,
    refreshReactions,
    commonEmojis: COMMON_EMOJIS,
  }), [
    reactions,
    loading,
    error,
    addReaction,
    removeReaction,
    getReactionsByTask,
    getTaskReactionCounts,
    getUserReaction,
    refreshReactions,
  ])

  return (
    <ReactionContext.Provider value={contextValue}>
      {children}
    </ReactionContext.Provider>
  )
}

export function useReactions() {
  const context = useContext(ReactionContext)
  if (context === undefined) {
    throw new Error('useReactions must be used within a ReactionProvider')
  }
  return context
}
