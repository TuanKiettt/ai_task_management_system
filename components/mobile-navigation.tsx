"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, CheckSquare, BarChart3, Users, Settings, Menu, X,
  Calendar, MessageSquare, Bell, Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/context/notification-context"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Tasks", href: "/", icon: CheckSquare },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Workspaces", href: "/workspaces", icon: Users },
  { label: "Calendar", href: "/timetable", icon: Calendar },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount } = useNotifications()

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed bottom-4 left-4 z-50">
        <Button
          onClick={toggleMenu}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-violet-600 hover:bg-violet-700"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={toggleMenu} />
      )}

      {/* Mobile Navigation Menu */}
      <div className={cn(
        "md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Navigation</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                             (item.href !== "/" && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={toggleMenu}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-violet-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              AI Task Extraction App
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30">
        <div className="grid grid-cols-5 h-16">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
                           (item.href !== "/" && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  isActive
                    ? "text-violet-600"
                    : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.label === "Tasks" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Add padding to bottom to account for fixed navigation */}
      <div className="md:hidden h-16" />
    </>
  )
}

// Mobile Header Component
export function MobileHeader({ title, onOpenSearch, onOpenChat }: {
  title?: string
  onOpenSearch?: () => void
  onOpenChat?: () => void
}) {
  const { unreadCount } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <header className="md:hidden sticky top-0 z-20 bg-card border-b border-border">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <MobileNavigation />
          <h1 className="text-lg font-semibold">{title || "Tasks"}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {onOpenSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenSearch}
              className="h-8 w-8 p-0"
            >
              <Search className="w-4 h-4" />
            </Button>
          )}
          
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="h-8 w-8 p-0"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-violet-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-border">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-3 text-center text-muted-foreground text-sm">
                    No new notifications
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {onOpenChat && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenChat}
              className="h-8 w-8 p-0"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

// Mobile Search Component
export function MobileSearch({ isOpen, onClose, onSearch }: {
  isOpen: boolean
  onClose: () => void
  onSearch: (query: string) => void
}) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="md:hidden fixed inset-0 z-50 bg-background">
      <div className="bg-card border-b border-border">
        <div className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tasks, projects, or anything..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoFocus
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Button type="submit">Search</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </form>
        </div>
      </div>
      
      <div className="p-4">
        <div className="text-center text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Start typing to search</p>
        </div>
      </div>
    </div>
  )
}
