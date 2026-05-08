"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useUser } from "./user-context"

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | "urgent"
  read: boolean
  createdAt: Date
  /** Alias for createdAt – used by header/inbox components */
  timestamp: number
  category?: "task" | "mention" | "reminder" | "system"
  actionUrl?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  addNotification: (notification: Omit<Notification, "id" | "read" | "createdAt" | "timestamp">) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearNotification: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useUser()

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      // Fallback: Show demo notifications when no user
      const demoNotifications: Notification[] = [
        {
          id: "demo-1",
          title: "Welcome to your Inbox! 🎉",
          message: "This is your notification center. You'll see task updates, reminders, and system messages here.",
          type: "info",
          read: false,
          createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          timestamp: Date.now() - 5 * 60 * 1000,
          category: "system"
        },
        {
          id: "demo-2", 
          title: "Task Created Successfully",
          message: "Your task 'prepare a presentation AI' has been added to your todo list.",
          type: "success",
          read: false,
          createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          timestamp: Date.now() - 15 * 60 * 1000,
          category: "task"
        },
        {
          id: "demo-3",
          title: "Quick Tip 💡",
          message: "Try editing your tasks by hovering over them and clicking the edit button. You can change priority, due dates, and more!",
          type: "info", 
          read: true,
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          timestamp: Date.now() - 30 * 60 * 1000,
          category: "system"
        },
        {
          id: "demo-4",
          title: "Calendar Integration Active",
          message: "Your tasks with due dates will automatically appear in the calendar view. Try setting a due date for your next task!",
          type: "success",
          read: true,
          createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          timestamp: Date.now() - 60 * 60 * 1000,
          category: "reminder"
        }
      ]
      
      setNotifications(demoNotifications)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/notifications?userId=${userId}`)
      if (!response.ok) {
        // Fallback to demo notifications if API fails
        console.warn('API failed, using demo notifications')
        const demoNotifications: Notification[] = [
          {
            id: "demo-api-fallback",
            title: "Connection Issue",
            message: "Unable to connect to server. Showing demo notifications instead.",
            type: "warning",
            read: false,
            createdAt: new Date(),
            timestamp: Date.now(),
            category: "system"
          }
        ]
        setNotifications(demoNotifications)
        setLoading(false)
        return
      }
      
      const notificationsData = await response.json()
      
      // Handle different API response structures
      let notificationsArray = []
      if (Array.isArray(notificationsData)) {
        notificationsArray = notificationsData
      } else if (notificationsData.notifications && Array.isArray(notificationsData.notifications)) {
        notificationsArray = notificationsData.notifications
      } else {
        console.warn('Unexpected API response structure:', notificationsData)
        notificationsArray = []
      }
      
      // Convert date strings to Date objects
      const notificationsWithDates = notificationsArray.map((notif: any) => ({
        ...notif,
        createdAt: new Date(notif.createdAt),
        timestamp: notif.timestamp,
      }))
      
      setNotifications(notificationsWithDates)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Failed to fetch notifications:", err)
      
      // Fallback to demo notifications on error
      const demoNotifications: Notification[] = [
        {
          id: "demo-error-fallback",
          title: "Demo Mode Active",
          message: "Using demo notifications due to connection issues. Your notifications will be saved when connection is restored.",
          type: "info",
          read: false,
          createdAt: new Date(),
          timestamp: Date.now(),
          category: "system"
        }
      ]
      setNotifications(demoNotifications)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Load notifications on mount and when userId changes
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const addNotification = useCallback(async (notification: Omit<Notification, "id" | "read" | "createdAt" | "timestamp">) => {
    if (!userId) {
      // Fallback: Add notification to local state when no user
      const newNotification: Notification = {
        ...notification,
        id: `local-${Date.now()}`,
        read: false,
        createdAt: new Date(),
        timestamp: Date.now(),
      }
      
      setNotifications(prev => [newNotification, ...prev])
      console.log('Notification added to local state:', newNotification.title)
      return
    }

    try {
      setError(null)
      
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...notification, userId }),
      })
      
      if (!response.ok) {
        // Fallback: Add to local state if API fails
        console.warn('API failed, adding notification to local state')
        const newNotification: Notification = {
          ...notification,
          id: `fallback-${Date.now()}`,
          read: false,
          createdAt: new Date(),
          timestamp: Date.now(),
        }
        
        setNotifications(prev => [newNotification, ...prev])
        return
      }
      
      // Refresh notifications after adding
      await fetchNotifications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create notification")
      console.error("Failed to add notification:", err)
      
      // Fallback: Add to local state on error
      const newNotification: Notification = {
        ...notification,
        id: `error-${Date.now()}`,
        read: false,
        createdAt: new Date(),
        timestamp: Date.now(),
      }
      
      setNotifications(prev => [newNotification, ...prev])
      setError(null) // Clear error to not break UI
    }
  }, [userId, fetchNotifications])

  const markAsRead = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read: true }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update notification")
      }
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update notification")
      console.error("Failed to mark notification as read:", err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      setError(null)
      
      // Update all unread notifications
      const unreadNotifications = notifications.filter(n => !n.read)
      const updatePromises = unreadNotifications.map(notif =>
        fetch(`/api/notifications/${notif.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ read: true }),
        })
      )
      
      await Promise.all(updatePromises)
      
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark all as read")
      console.error("Failed to mark all notifications as read:", err)
    }
  }, [notifications])

  const clearNotification = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete notification")
      }
      
      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete notification")
      console.error("Failed to delete notification:", err)
    }
  }, [])

  const clearAll = useCallback(async () => {
    try {
      setError(null)
      
      // Delete all notifications
      const deletePromises = notifications.map(notif =>
        fetch(`/api/notifications/${notif.id}`, {
          method: "DELETE",
        })
      )
      
      await Promise.all(deletePromises)
      
      // Update local state
      setNotifications([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear all notifications")
      console.error("Failed to clear all notifications:", err)
    }
  }, [notifications])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider")
  return context
}
