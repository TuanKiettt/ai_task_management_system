"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/header"
import { useNotifications, type Notification } from "@/context/notification-context"
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Inbox,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  AtSign,
  Clock,
  Zap,
  X,
  ArchiveX,
} from "lucide-react"
import { cn } from "@/lib/utils"

type FilterTab = "all" | "unread" | "task" | "mention" | "reminder" | "system"

const filterTabs: { id: FilterTab; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Inbox className="w-4 h-4" /> },
  { id: "unread", label: "Unread", icon: <Bell className="w-4 h-4" /> },
  { id: "task", label: "Tasks", icon: <CheckCircle className="w-4 h-4" /> },
  { id: "mention", label: "Mentions", icon: <AtSign className="w-4 h-4" /> },
  { id: "reminder", label: "Reminders", icon: <Clock className="w-4 h-4" /> },
  { id: "system", label: "System", icon: <Zap className="w-4 h-4" /> },
]

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function NotifIcon({ type }: { type: Notification["type"] }) {
  switch (type) {
    case "urgent":
      return (
        <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
      )
    case "warning":
      return (
        <div className="w-9 h-9 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
        </div>
      )
    case "success":
      return (
        <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>
      )
    case "error":
      return (
        <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <X className="w-5 h-5 text-red-500" />
        </div>
      )
    default:
      return (
        <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
          <Info className="w-5 h-5 text-violet-500" />
        </div>
      )
  }
}

function typeBadge(type: Notification["type"]) {
  switch (type) {
    case "urgent":
      return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
    case "warning":
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
    case "success":
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
    case "error":
      return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
    default:
      return "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"
  }
}

export default function InboxPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAll, loading, error } =
    useNotifications()
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    switch (activeFilter) {
      case "unread":
        return notifications.filter((n) => !n.read)
      case "task":
        return notifications.filter((n) => n.category === "task")
      case "mention":
        return notifications.filter((n) => n.category === "mention")
      case "reminder":
        return notifications.filter((n) => n.category === "reminder")
      case "system":
        return notifications.filter((n) => n.category === "system")
      default:
        return notifications
    }
  }, [notifications, activeFilter])

  const selected = notifications.find((n) => n.id === selectedId) ?? null

  const handleSelect = (notif: Notification) => {
    setSelectedId(notif.id)
    if (!notif.read) markAsRead(notif.id)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    clearNotification(id)
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#13171f]">
      <Header />

      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-[#2d3548] bg-white dark:bg-[#1a1f2e] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Inbox</h1>
            {unreadCount > 0 && (
              <span className="bg-violet-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => { clearAll(); setSelectedId(null) }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <ArchiveX className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 dark:border-[#2d3548] bg-white dark:bg-[#1a1f2e] px-6">
        <div className="flex items-center gap-1 overflow-x-auto">
          {filterTabs.map((tab) => {
            const count =
              tab.id === "all"
                ? notifications.length
                : tab.id === "unread"
                  ? unreadCount
                  : notifications.filter((n) => n.category === tab.id).length
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeFilter === tab.id
                    ? "border-violet-600 text-violet-600"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      activeFilter === tab.id
                        ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600"
                        : "bg-gray-100 dark:bg-[#252b3b] text-gray-500 dark:text-gray-400",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[400px]">
          {/* Notification List */}
          <div className="w-full lg:w-96 xl:w-[420px] flex-shrink-0 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-[#2d3548] rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-[#252b3b] flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
              </span>
              <Filter className="w-4 h-4 text-gray-400" />
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-gray-100 dark:divide-[#252b3b]">
              {loading ? (
                <div className="flex items-center justify-center h-full py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
                  <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                    <AlertCircle className="w-7 h-7 text-red-500" />
                  </div>
                  <p className="text-red-600 dark:text-red-400 font-medium">Error loading notifications</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    {error}
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-[#252b3b] flex items-center justify-center mb-4">
                    <Inbox className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium">All caught up</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    No notifications in this category
                  </p>
                </div>
              ) : (
                filtered.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleSelect(notif)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors group relative",
                      selectedId === notif.id
                        ? "bg-violet-50 dark:bg-violet-900/10"
                        : "hover:bg-gray-50 dark:hover:bg-[#252b3b]",
                      !notif.read && "bg-violet-50/50 dark:bg-violet-900/5",
                    )}
                  >
                    {/* Unread dot */}
                    {!notif.read && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-600" />
                    )}

                    <NotifIcon type={notif.type} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            notif.read
                              ? "text-gray-600 dark:text-gray-300 font-normal"
                              : "text-gray-900 dark:text-white font-semibold",
                          )}
                        >
                          {notif.title}
                        </p>
                        <button
                          onClick={(e) => handleDelete(notif.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        {timeAgo(notif.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="flex-1 hidden lg:flex flex-col bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-[#2d3548] rounded-xl overflow-hidden">
            {selected ? (
              <>
                {/* Detail Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-[#252b3b] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <NotifIcon type={selected.type} />
                    <div>
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                        {selected.title}
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                            typeBadge(selected.type),
                          )}
                        >
                          {selected.type}
                        </span>
                        {selected.category && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                            {selected.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(selected.id, e)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Detail Body */}
                <div className="flex-1 px-6 py-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                    {selected.message}
                  </p>
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-[#252b3b] space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Received</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(selected.timestamp).toLocaleString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          selected.read
                            ? "bg-gray-100 dark:bg-[#252b3b] text-gray-600 dark:text-gray-400"
                            : "bg-violet-100 dark:bg-violet-900/30 text-violet-600",
                        )}
                      >
                        {selected.read ? "Read" : "Unread"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Category</span>
                      <span className="text-gray-900 dark:text-white capitalize">
                        {selected.category ?? "General"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detail Actions */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-[#252b3b] flex items-center gap-3">
                  {!selected.read && (
                    <button
                      onClick={() => markAsRead(selected.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(selected.id, e)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#252b3b] flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">
                  Select a notification
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                  Click any notification on the left to view its full details here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
