"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, AlertCircle, Filter } from "lucide-react"
import { useState, useMemo } from "react"
import { useTimetable, type TimetableEntry } from "@/context/timetable-context"
import { useUser } from "@/context/user-context"

interface ScheduleItem {
  id: string
  time: string
  subject: string
  duration: string
  location?: string
  originalEntry?: TimetableEntry // Store original entry for operations
}

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

export default function TimetablePage() {
  const [currentDay, setCurrentDay] = useState(new Date().getDay() === 0 ? 1 : Math.min(new Date().getDay(), 5))
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItem, setNewItem] = useState({ time: "", subject: "", duration: "1h", location: "" })
  const [subjectFilter, setSubjectFilter] = useState("all")
  
  const { entries, addEntry, deleteEntry, loading, error, refreshEntries } = useTimetable()
  const { userId } = useUser()
  
  // Transform database entries to the format expected by the UI
  const weekSchedule = useMemo(() => {
    const schedule: Record<number, ScheduleItem[]> = {}
    
    // Initialize all weekdays (1-5 for Monday-Friday)
    for (let i = 1; i <= 5; i++) {
      schedule[i] = []
    }
    
    // Group and transform entries
    entries.forEach((entry) => {
      // Convert dayOfWeek (0=Sunday, 1=Monday, etc.) to UI format (1=Monday, 5=Friday)
      const uiDay = entry.dayOfWeek === 0 ? 7 : entry.dayOfWeek // Sunday becomes 7, we only show 1-5
      
      if (uiDay >= 1 && uiDay <= 5) {
        // Calculate duration from start and end time
        const start = new Date(`2000-01-01T${entry.startTime}:00`)
        const end = new Date(`2000-01-01T${entry.endTime}:00`)
        const durationMs = end.getTime() - start.getTime()
        const durationHours = durationMs / (1000 * 60 * 60)
        const duration = durationHours < 1 ? `${Math.round(durationHours * 60)}m` : `${durationHours}h`
        
        const scheduleItem: ScheduleItem = {
          id: entry.id,
          time: entry.startTime,
          subject: entry.subject,
          duration: duration,
          location: entry.location || undefined,
          originalEntry: entry,
        }
        
        schedule[uiDay].push(scheduleItem)
      }
    })
    
    // Sort entries by time for each day
    Object.keys(schedule).forEach((day) => {
      schedule[Number(day)].sort((a, b) => a.time.localeCompare(b.time))
    })
    
    return schedule
  }, [entries])

  const handleAddItem = async () => {
    if (!userId) {
      console.error("User not logged in")
      return
    }
    
    if (newItem.time && newItem.subject) {
      // Convert duration to end time
      const [hours, minutes] = newItem.duration.split('h').map((s: string) => parseFloat(s) || 0)
      const totalMinutes = hours * 60 + minutes
      const [startHour, startMinute] = newItem.time.split(':').map((s: string) => parseInt(s) || 0)
      const endTotalMinutes = startHour * 60 + startMinute + totalMinutes
      const endHour = Math.floor(endTotalMinutes / 60)
      const endMinute = endTotalMinutes % 60
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
      
      // Convert UI day (1=Monday) to database day (1=Monday)
      const dayOfWeek = currentDay
      
      await addEntry({
        userId,
        dayOfWeek,
        startTime: newItem.time,
        endTime,
        subject: newItem.subject,
        location: newItem.location || undefined,
      })
      
      setNewItem({ time: "", subject: "", duration: "1h", location: "" })
      setShowAddModal(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    await deleteEntry(id)
  }

  const currentSchedule = weekSchedule[currentDay] || []

  // Get unique subjects for filter
  const allSubjects = useMemo(() => {
    const subjects = new Set<string>()
    entries.forEach(entry => {
      subjects.add(entry.subject)
    })
    return Array.from(subjects).sort()
  }, [entries])

  // Filter current schedule by subject
  const filteredSchedule = useMemo(() => {
    if (subjectFilter === "all") return currentSchedule
    return currentSchedule.filter(item => item.subject === subjectFilter)
  }, [currentSchedule, subjectFilter])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Timetable</h1>
              <p className="text-muted-foreground">Your weekly class schedule</p>
            </div>
            <div className="flex items-center gap-3">
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <Button onClick={() => setShowAddModal(true)} disabled={loading}>
                <Plus className="w-4 h-4 mr-2" /> Add Class
              </Button>
            </div>
          </div>

          {/* Day Selector */}
          <div className="flex items-center justify-between bg-card rounded-xl p-2 border">
            <button
              onClick={() => setCurrentDay(Math.max(1, currentDay - 1))}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              disabled={currentDay === 1}
            >
              <ChevronLeft className={`w-5 h-5 ${currentDay === 1 ? "text-muted-foreground" : "text-foreground"}`} />
            </button>
            <div className="flex gap-2">
              {weekDays.map((day, index) => (
                <button
                  key={day}
                  onClick={() => setCurrentDay(index + 1)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentDay === index + 1
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 3)}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentDay(Math.min(5, currentDay + 1))}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              disabled={currentDay === 5}
            >
              <ChevronRight className={`w-5 h-5 ${currentDay === 5 ? "text-muted-foreground" : "text-foreground"}`} />
            </button>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <button
              onClick={() => setSubjectFilter("all")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                subjectFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent border"
              }`}
            >
              All Subjects
            </button>
            {allSubjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setSubjectFilter(subject)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  subjectFilter === subject
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent border"
                }`}
              >
                {subject}
              </button>
            ))}
          </div>

          {/* Schedule Card */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 border-b">
              <Clock className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{weekDays[currentDay - 1]} Schedule</CardTitle>
              <span className="text-sm text-muted-foreground">
                ({filteredSchedule.length} classes)
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {filteredSchedule.length > 0 ? (
                filteredSchedule.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center px-6 py-4 border-b last:border-0 hover:bg-accent/50 transition-colors group"
                  >
                    <span className="text-muted-foreground font-mono w-20">{item.time}</span>
                    <div className="flex-1">
                      <span className="text-foreground font-medium">{item.subject}</span>
                      {item.location && (
                        <span className="text-muted-foreground text-sm ml-3">({item.location})</span>
                      )}
                    </div>
                    <span className="text-muted-foreground/50 text-xs font-bold uppercase tracking-wider mr-4">
                      {item.duration}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button className="p-1 hover:bg-accent rounded">
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  {subjectFilter === "all" 
                    ? "No classes scheduled for this day" 
                    : `No ${subjectFilter} classes scheduled for this day`
                  }
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card rounded-xl p-4 border text-center">
              <p className="text-2xl font-bold text-foreground">{currentSchedule.length}</p>
              <p className="text-muted-foreground text-sm">Classes Today</p>
            </div>
            <div className="bg-card rounded-xl p-4 border text-center">
              <p className="text-2xl font-bold text-foreground">
                {Object.values(weekSchedule).flat().reduce((acc: number, item: ScheduleItem) => {
                  const hours = parseFloat(item.duration) || 1
                  return acc + hours
                }, 0)}h
              </p>
              <p className="text-muted-foreground text-sm">Total Hours</p>
            </div>
            <div className="bg-card rounded-xl p-4 border text-center">
              <p className="text-2xl font-bold text-foreground">
                {Object.values(weekSchedule).flat().length}
              </p>
              <p className="text-muted-foreground text-sm">Weekly Classes</p>
            </div>
          </div>
        </div>
      </main>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {!loading && (
        <>
          {/* Add Class Modal */}
          {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-popover rounded-2xl border w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Add New Class</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase text-primary font-semibold mb-2 block">Time</label>
                  <input
                    type="time"
                    value={newItem.time}
                    onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                    className="w-full bg-background border rounded-xl px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase text-primary font-semibold mb-2 block">Duration</label>
                  <select
                    value={newItem.duration}
                    onChange={(e) => setNewItem({ ...newItem, duration: e.target.value })}
                    className="w-full bg-background border rounded-xl px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="30m">30 minutes</option>
                    <option value="1h">1 hour</option>
                    <option value="1.5h">1.5 hours</option>
                    <option value="2h">2 hours</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase text-primary font-semibold mb-2 block">Subject</label>
                <input
                  type="text"
                  value={newItem.subject}
                  onChange={(e) => setNewItem({ ...newItem, subject: e.target.value })}
                  placeholder="Enter subject name..."
                  className="w-full bg-background border rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-primary font-semibold mb-2 block">Location (optional)</label>
                <input
                  type="text"
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  placeholder="e.g., Room 101"
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
                  onClick={handleAddItem}
                  className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Add Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
