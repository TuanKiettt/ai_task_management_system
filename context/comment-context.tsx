"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { useUser } from "./user-context"

export interface Comment {
  id: string
  taskId: string
  userId: string
  content: string
  mentions: string[]
  createdAt: Date
  updatedAt: Date
  user?: {
    id: string
    fullName: string
    email: string
    avatar?: string
  }
  reactions?: CommentReaction[]
}

export interface CommentReaction {
  id: string
  commentId: string
  userId: string
  emoji: string
  createdAt: Date
  user?: {
    id: string
    fullName: string
    avatar?: string
  }
}

interface CommentContextType {
  comments: Comment[]
  loading: boolean
  error: string | null
  
  // Comment management
  addComment: (taskId: string, content: string, mentions?: string[]) => Promise<Comment>
  updateComment: (commentId: string, content: string) => Promise<Comment>
  deleteComment: (commentId: string) => Promise<void>
  
  // Reaction management
  addCommentReaction: (commentId: string, emoji: string) => Promise<CommentReaction>
  removeCommentReaction: (commentId: string, emoji: string) => Promise<void>
  
  // Utility functions
  getCommentsByTask: (taskId: string) => Comment[]
  refreshComments: (taskId?: string) => Promise<void>
}

const CommentContext = createContext<CommentContextType | undefined>(undefined)

export function CommentProvider({ children }: { children: React.ReactNode }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useUser()

  const getCurrentUserId = () => {
    return userId || "demo-user"
  }

  // Fetch comments for a task
  const fetchComments = useCallback(async (taskId?: string) => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      let url = `/api/comments?userId=${getCurrentUserId()}`
      if (taskId) {
        url += `&taskId=${taskId}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }

      const commentsData = await response.json()
      
      // Convert date strings to Date objects
      const commentsWithDates = commentsData.map((comment: any) => ({
        ...comment,
        createdAt: new Date(comment.createdAt),
        updatedAt: new Date(comment.updatedAt),
      }))

      if (taskId) {
        // Replace comments for specific task
        setComments(prev => [
          ...prev.filter(c => c.taskId !== taskId),
          ...commentsWithDates
        ])
      } else {
        // Replace all comments
        setComments(commentsWithDates)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments')
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Add comment
  const addComment = useCallback(async (taskId: string, content: string, mentions: string[] = []) => {
    try {
      setError(null)

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          userId: getCurrentUserId(),
          content,
          mentions,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const newComment = await response.json()
      
      // Convert date strings to Date objects
      const commentWithDates = {
        ...newComment,
        createdAt: new Date(newComment.createdAt),
        updatedAt: new Date(newComment.updatedAt),
      }

      setComments(prev => [commentWithDates, ...prev])
      return commentWithDates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
      console.error('Error adding comment:', err)
      throw err
    }
  }, [])

  // Update comment
  const updateComment = useCallback(async (commentId: string, content: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('Failed to update comment')
      }

      const updatedComment = await response.json()
      
      // Convert date strings to Date objects
      const commentWithDates = {
        ...updatedComment,
        createdAt: new Date(updatedComment.createdAt),
        updatedAt: new Date(updatedComment.updatedAt),
      }

      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId ? commentWithDates : comment
        )
      )
      return commentWithDates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment')
      console.error('Error updating comment:', err)
      throw err
    }
  }, [])

  // Delete comment
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      setComments(prev => prev.filter(comment => comment.id !== commentId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment')
      console.error('Error deleting comment:', err)
      throw err
    }
  }, [])

  // Add comment reaction
  const addCommentReaction = useCallback(async (commentId: string, emoji: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emoji,
          userId: getCurrentUserId(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add reaction')
      }

      const newReaction = await response.json()
      
      // Convert date strings to Date objects
      const reactionWithDates = {
        ...newReaction,
        createdAt: new Date(newReaction.createdAt),
      }

      // Update comment with new reaction
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? {
                ...comment,
                reactions: [...(comment.reactions || []), reactionWithDates]
              }
            : comment
        )
      )
      return reactionWithDates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reaction')
      console.error('Error adding reaction:', err)
      throw err
    }
  }, [])

  // Remove comment reaction
  const removeCommentReaction = useCallback(async (commentId: string, emoji: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/comments/${commentId}/reactions/${emoji}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove reaction')
      }

      // Update comment by removing the reaction
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? {
                ...comment,
                reactions: (comment.reactions || []).filter(
                  reaction => !(reaction.emoji === emoji && reaction.userId === getCurrentUserId())
                )
              }
            : comment
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove reaction')
      console.error('Error removing reaction:', err)
      throw err
    }
  }, [])

  // Get comments by task
  const getCommentsByTask = useCallback((taskId: string) => {
    return comments.filter(comment => comment.taskId === taskId)
  }, [comments])

  // Refresh comments
  const refreshComments = useCallback(async (taskId?: string) => {
    await fetchComments(taskId)
  }, [fetchComments])

  const contextValue: CommentContextType = useMemo(() => ({
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    addCommentReaction,
    removeCommentReaction,
    getCommentsByTask,
    refreshComments,
  }), [
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    addCommentReaction,
    removeCommentReaction,
    getCommentsByTask,
    refreshComments,
  ])

  return (
    <CommentContext.Provider value={contextValue}>
      {children}
    </CommentContext.Provider>
  )
}

export function useComments() {
  const context = useContext(CommentContext)
  if (context === undefined) {
    throw new Error('useComments must be used within a CommentProvider')
  }
  return context
}
