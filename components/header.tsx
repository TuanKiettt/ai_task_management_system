"use client"

import { Bell, Search, MessageSquare, HelpCircle, LayoutGrid, Sun, Moon, Monitor, BarChart3 } from "lucide-react"
import { CommandPalette } from "./command-palette"
import { useUser } from "@/context/user-context"
import { UserDropdown } from "./user-dropdown"
import { useNotifications } from "@/context/notification-context"
import { useTheme } from "@/context/theme-context"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

export function Header({ onOpenChat }: { onOpenChat?: () => void }) {
  const { userName } = useUser()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { theme, setTheme } = useTheme()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const themeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="flex items-center justify-between h-14 px-3 sm:px-4 bg-card border-b border-border sticky top-0 z-10">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-1 text-sm">
          <span className="text-muted-foreground hidden sm:inline">Workspace</span>
          <span className="text-muted-foreground hidden sm:inline">/</span>
          <span className="font-medium text-foreground">Tasks</span>
        </nav>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-xl mx-4 md:mx-8 hidden md:block">
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
          className="w-full flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-muted-foreground text-sm transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-card border border-border rounded text-xs text-muted-foreground">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors hidden sm:flex">
            <LayoutGrid className="w-5 h-5 text-muted-foreground" />
          </button>
          {/* Analytics */}
          <a
            href="/analytics"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="View analytics"
          >
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </a>

          {/* Chat */}
          <button
            onClick={onOpenChat}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Open chat"
          >
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Theme Toggle */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-muted-foreground" />
              ) : theme === "light" ? (
                <Sun className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Monitor className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTheme(t); setShowThemeMenu(false) }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted",
                      theme === t ? "text-violet-500 font-medium" : "text-foreground"
                    )}
                  >
                    {t === "light" && <Sun className="w-4 h-4" />}
                    {t === "dark" && <Moon className="w-4 h-4" />}
                    {t === "system" && <Monitor className="w-4 h-4" />}
                    <span className="capitalize">{t}</span>
                    {theme === t && <span className="ml-auto w-2 h-2 rounded-full bg-violet-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-violet-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-medium">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-violet-600 hover:text-violet-700">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 6).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={cn(
                          "p-3 border-b border-border hover:bg-muted cursor-pointer transition-colors",
                          !notif.read && "bg-violet-50 dark:bg-violet-900/10"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                            notif.type === "urgent" ? "bg-red-500" : notif.type === "success" ? "bg-green-500" : "bg-violet-500"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-medium truncate">{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(notif.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      <Bell className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="p-2 hover:bg-muted rounded-lg transition-colors hidden sm:flex">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="w-px h-6 bg-border mx-1 sm:mx-2" />
        <UserDropdown />
      </div>
      <CommandPalette />
    </header>
  )
}
