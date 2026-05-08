"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useUser } from "./user-context"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

interface ChatContextType {
  conversations: ChatConversation[]
  currentConversationId: string | null
  currentConversation: ChatConversation | null
  loading: boolean
  error: string | null
  createConversation: (title: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  addMessage: (message: ChatMessage) => Promise<void>
  switchConversation: (id: string) => void
  clearAllConversations: () => Promise<void>
  refreshConversations: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useUser()

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      // Fallback: Create mock conversation when no userId
      setConversations([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/conversations?userId=${userId}`)
      if (!response.ok) {
        // If API fails, fallback to empty conversations
        console.warn("API failed, using empty conversations")
        setConversations([])
        setLoading(false)
        return
      }
      
      const conversationsData = await response.json()
      
      // Convert date strings to Date objects
      const conversationsWithDates = conversationsData.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }))
      
      setConversations(conversationsWithDates)
    } catch (err) {
      // Fallback: Don't show error, just use empty conversations
      console.warn("Failed to fetch conversations, using empty state:", err)
      setConversations([])
      setError(null) // Clear error to not break UI
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Load conversations on mount and when userId changes
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const currentConversation = conversations.find(conv => conv.id === currentConversationId) || null

  const createConversation = useCallback(async (title: string) => {
    if (!userId) {
      console.error("User not logged in")
      return
    }

    try {
      setError(null)
      
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, title }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to create conversation")
      }
      
      const newConversation = await response.json()
      const conversationWithDates = {
        ...newConversation,
        createdAt: new Date(newConversation.createdAt),
        updatedAt: new Date(newConversation.updatedAt),
        messages: [],
      }
      
      setConversations((prev) => [conversationWithDates, ...prev])
      setCurrentConversationId(conversationWithDates.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create conversation")
      console.error("Failed to create conversation:", err)
    }
  }, [userId])

  const deleteConversation = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete conversation")
      }
      
      setConversations((prev) => prev.filter(conv => conv.id !== id))
      if (currentConversationId === id) {
        setCurrentConversationId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete conversation")
      console.error("Failed to delete conversation:", err)
    }
  }, [currentConversationId])

  const addMessage = useCallback(async (message: ChatMessage) => {
    let conversationId = currentConversationId
    
    // If no current conversation, create one first
    if (!conversationId) {
      if (!userId) {
        // Fallback: Create mock conversation in memory only
        const mockConversation: ChatConversation = {
          id: `mock-${Date.now()}`,
          title: `Chat ${new Date().toLocaleDateString()}`,
          messages: [message],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        setConversations(prev => [...prev, mockConversation])
        setCurrentConversationId(mockConversation.id)
        return
      }
      
      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            userId, 
            title: `Chat ${new Date().toLocaleDateString()}` 
          }),
        })
        
        if (!response.ok) {
          // Fallback: Create mock conversation if API fails
          console.warn("Failed to create conversation, using mock")
          const mockConversation: ChatConversation = {
            id: `mock-${Date.now()}`,
            title: `Chat ${new Date().toLocaleDateString()}`,
            messages: [message],
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          
          setConversations(prev => [...prev, mockConversation])
          setCurrentConversationId(mockConversation.id)
          return
        }
        
        const newConversation = await response.json()
        const conversationWithDates = {
          ...newConversation,
          createdAt: new Date(newConversation.createdAt),
          updatedAt: new Date(newConversation.updatedAt),
          messages: [],
        }
        
        setConversations((prev) => [conversationWithDates, ...prev])
        setCurrentConversationId(conversationWithDates.id)
        conversationId = conversationWithDates.id
      } catch (err) {
        console.error("Failed to create conversation for message:", err)
        return
      }
    }

    try {
      setError(null)
      
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          role: message.role,
          content: message.content,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to create message")
      }
      
      const newMessage = await response.json()
      const messageWithDate = {
        ...newMessage,
        timestamp: new Date(newMessage.timestamp),
      }
      
      // Update local state
      setConversations((prev) => 
        prev.map(conv => 
          conv.id === currentConversationId 
            ? {
                ...conv,
                messages: [...conv.messages, messageWithDate],
                updatedAt: new Date(),
              }
            : conv
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add message")
      console.error("Failed to add message:", err)
    }
  }, [currentConversationId, userId])

  const switchConversation = useCallback((id: string) => {
    setCurrentConversationId(id)
  }, [])

  const clearAllConversations = useCallback(async () => {
    try {
      setError(null)
      
      // Delete all conversations
      const deletePromises = conversations.map(conv =>
        fetch(`/api/conversations/${conv.id}`, {
          method: "DELETE",
        })
      )
      
      await Promise.all(deletePromises)
      
      setConversations([])
      setCurrentConversationId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear conversations")
      console.error("Failed to clear conversations:", err)
    }
  }, [conversations])

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversationId,
        currentConversation,
        loading,
        error,
        createConversation,
        deleteConversation,
        addMessage,
        switchConversation,
        clearAllConversations,
        refreshConversations: fetchConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) throw new Error("useChat must be used within a ChatProvider")
  return context
}
