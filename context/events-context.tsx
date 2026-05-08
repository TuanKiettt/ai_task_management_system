"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useUser } from "./user-context"

export interface Event {
  id: string
  date: string
  time: string
  title: string
  location?: string
  attendees?: number
  type: "meeting" | "conference" | "workshop" | "social"
}

interface EventContextType {
  events: Event[]
  loading: boolean
  error: string | null
  addEvent: (event: Omit<Event, "id">) => Promise<void>
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  refreshEvents: () => Promise<void>
}

const EventContext = createContext<EventContextType | undefined>(undefined)

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useUser()

  const fetchEvents = useCallback(async () => {
    if (!userId) {
      setEvents([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/events?userId=${userId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch events")
      }
      
      const eventsData = await response.json()
      setEvents(eventsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Failed to fetch events:", err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Load events on mount and when userId changes
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const addEvent = useCallback(async (event: Omit<Event, "id">) => {
    if (!userId) {
      console.error("User not logged in")
      return
    }

    try {
      setError(null)
      
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...event, userId }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to create event")
      }
      
      const newEvent = await response.json()
      setEvents((prev) => [...prev, newEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event")
      console.error("Failed to add event:", err)
    }
  }, [userId])

  const updateEvent = useCallback(async (id: string, updates: Partial<Event>) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update event")
      }
      
      const updatedEvent = await response.json()
      setEvents((prev) => 
        prev.map((event) => event.id === id ? updatedEvent : event)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event")
      console.error("Failed to update event:", err)
    }
  }, [])

  const deleteEvent = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete event")
      }
      
      setEvents((prev) => prev.filter((event) => event.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event")
      console.error("Failed to delete event:", err)
    }
  }, [])

  return (
    <EventContext.Provider
      value={{
        events,
        loading,
        error,
        addEvent,
        updateEvent,
        deleteEvent,
        refreshEvents: fetchEvents,
      }}
    >
      {children}
    </EventContext.Provider>
  )
}

export const useEvents = () => {
  const context = useContext(EventContext)
  if (!context) throw new Error("useEvents must be used within an EventProvider")
  return context
}
