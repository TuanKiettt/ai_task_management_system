"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { FloatingChat, FloatingChatButton } from "@/components/floating-chat"
import { TodoList } from "@/components/todo-list"
import { CalendarView } from "@/components/calendar-view"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { OverdueTasksWarning } from "@/components/overdue-tasks-warning"
import { useUser } from "@/context/user-context"
import { Onboarding } from "@/components/onboarding"
import { CorporateDashboard, CreativeDashboard, MedicalDashboard } from "@/components/industry-dashboards"
import { BarChart3, List, Calendar, Kanban } from "lucide-react"

export default function AlbaDashboard() {
  const { industry, userName } = useUser()
  const [currentView, setCurrentView] = useState("list")
  const [chatOpen, setChatOpen] = useState(false)

  if (!industry) {
    return <Onboarding />
  }

  const views = [
    { id: "list", icon: List, label: "List" },
    { id: "board", icon: Kanban, label: "Board" },
    { id: "calendar", icon: Calendar, label: "Calendar" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
  ]

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-violet-500/30">
      <Header onOpenChat={() => setChatOpen(true)} />

      {/* View Tabs */}
      <div className="border-b border-border bg-card px-3 sm:px-6 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1 min-w-max">
          {views.map((view) => {
            const Icon = view.icon
            return (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  currentView === view.id
                    ? "border-violet-600 text-violet-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{view.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <main className="p-3 sm:p-4 lg:p-6 space-y-4">
        {/* Overdue Tasks Warning */}
        <OverdueTasksWarning />
        
        {industry === "education" && (
          <>
            {currentView === "list" && <TodoList />}
            {currentView === "calendar" && <CalendarView />}
            {currentView === "analytics" && <AnalyticsDashboard />}
            {currentView === "board" && <TodoList />}
          </>
        )}
        {industry === "corporate" && <CorporateDashboard />}
        {industry === "creative" && <CreativeDashboard />}
        {industry === "medical" && <MedicalDashboard />}
      </main>

      {/* Floating AI Chat */}
      {chatOpen ? (
        <FloatingChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      ) : (
        <FloatingChatButton onClick={() => setChatOpen(true)} />
      )}
    </div>
  )
}
