"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Plus, MapPin, Clock, Users, Trash2, Filter } from "lucide-react"
import { useState } from "react"
import { useEvents, type Event } from "@/context/events-context"
import { useUser } from "@/context/user-context"

export default function EventsPage() {
  const { events, addEvent, deleteEvent, loading, error } = useEvents()
  const { userId } = useUser()

  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState<"all" | Event["type"]>("all")
  const [newEvent, setNewEvent] = useState({ 
    date: "", 
    time: "", 
    title: "", 
    location: "", 
    type: "meeting" as Event["type"],
    attendees: "10"
  })

  const filteredEvents = filter === "all" ? events : events.filter(e => e.type === filter)

  const handleAddEvent = async () => {
    if (newEvent.date && newEvent.time && newEvent.title && userId) {
      const event: Omit<Event, "id"> = {
        date: new Date(newEvent.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        time: newEvent.time,
        title: newEvent.title,
        location: newEvent.location,
        type: newEvent.type,
        attendees: parseInt(newEvent.attendees),
      }
      await addEvent(event)
      setNewEvent({ date: "", time: "", title: "", location: "", type: "meeting", attendees: "10" })
      setShowAddModal(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    await deleteEvent(id)
  }

  const getTypeColor = (type: Event["type"]) => {
    switch (type) {
      case "conference": return "bg-purple-500/20 text-purple-300 border-purple-500/30"
      case "workshop": return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "social": return "bg-green-500/20 text-green-300 border-green-500/30"
      default: return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Upcoming Events</h1>
              <p className="text-muted-foreground">Stay updated with all scheduled events</p>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Event
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card rounded-xl p-4 border text-center">
              <p className="text-2xl font-bold text-foreground">{events.length}</p>
              <p className="text-muted-foreground text-sm">Total Events</p>
            </div>
            <div className="bg-card rounded-xl p-4 border text-center">
              <p className="text-2xl font-bold text-foreground">{events.filter(e => e.type === "conference").length}</p>
              <p className="text-muted-foreground text-sm">Conferences</p>
            </div>
            <div className="bg-card rounded-xl p-4 border text-center">
              <p className="text-2xl font-bold text-foreground">{events.filter(e => e.type === "workshop").length}</p>
              <p className="text-muted-foreground text-sm">Workshops</p>
            </div>
            <div className="bg-card rounded-xl p-4 border text-center">
              <p className="text-2xl font-bold text-foreground">{events.filter(e => e.type === "meeting").length}</p>
              <p className="text-muted-foreground text-sm">Meetings</p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {["all", "conference", "workshop", "meeting", "social"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent border"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Events List */}
          <div className="grid gap-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <Trash2 className="w-7 h-7 text-destructive" />
                </div>
                <p className="text-destructive font-medium">Error loading events</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {error}
                </p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <CalendarIcon className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium">
                  {filter === "all" ? "No events scheduled" : `No ${filter} events scheduled`}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  {filter === "all" ? "Create your first event to get started" : `Try changing the filter or create a new ${filter} event`}
                </p>
              </div>
            ) : (
              filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="hover:bg-accent/50 transition-all group"
              >
                <CardContent className="p-4 flex items-center gap-6">
                  <div className="text-center w-16 flex-shrink-0">
                    <p className="text-primary font-bold text-sm uppercase">{event.date.split(" ")[0]}</p>
                    <p className="text-foreground text-2xl font-bold">{event.date.split(" ")[1]}</p>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                    </div>
                    <h3 className="text-foreground font-medium group-hover:text-primary transition-colors truncate">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {event.time}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {event.location}
                        </span>
                      )}
                      {event.attendees && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {event.attendees}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                    <CalendarIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))
            )}
          </div>
        </div>
      </main>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-popover rounded-2xl border w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Add New Event</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase text-primary font-semibold mb-2 block">Event Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Enter event title..."
                  className="w-full bg-background border rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase text-primary font-semibold mb-2 block">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full bg-background border rounded-xl px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase text-primary font-semibold mb-2 block">Time</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full bg-background border rounded-xl px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase text-primary font-semibold mb-2 block">Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as Event["type"] })}
                    className="w-full bg-background border rounded-xl px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="conference">Conference</option>
                    <option value="workshop">Workshop</option>
                    <option value="social">Social</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase text-primary font-semibold mb-2 block">Attendees</label>
                  <input
                    type="number"
                    value={newEvent.attendees}
                    onChange={(e) => setNewEvent({ ...newEvent, attendees: e.target.value })}
                    className="w-full bg-background border rounded-xl px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase text-primary font-semibold mb-2 block">Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="e.g., Main Hall"
                  className="w-full bg-background border rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground border hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
