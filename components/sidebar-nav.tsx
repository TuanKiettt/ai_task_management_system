"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { 
  Calendar, Clock, BookOpen, GraduationCap, CheckSquare, 
  Users, Briefcase, FileText, Palette, Lightbulb, FolderOpen, UserCircle, 
  ClipboardList, Stethoscope, ChevronDown, ChevronRight, Plus, Search,
  Home, Inbox, Settings, Star, Hash, MoreHorizontal, Menu, X, Bot, Share2, BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/context/user-context"
import { useNotifications } from "@/context/notification-context"
import { useWorkspace } from "@/context/workspace-context"
import { CommandPalette } from "./command-palette"

const navigationByIndustry = {
  education: [
    { name: "Home", href: "/", icon: Home },
    { name: "Workspaces", href: "/workspaces", icon: Users },
    { name: "Inbox", href: "/inbox", icon: Inbox },
    { name: "Tasks", href: "/todo", icon: CheckSquare },
    { name: "Timetable", href: "/timetable", icon: Clock },
    { name: "Assignments", href: "/assignments", icon: BookOpen },
    { name: "Learning", href: "/learning", icon: GraduationCap },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Automation", href: "/automation", icon: Bot },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ],
  corporate: [
    { name: "Home", href: "/", icon: Home },
    { name: "Workspaces", href: "/workspaces", icon: Users },
    { name: "Inbox", href: "/inbox", icon: Inbox },
    { name: "Tasks", href: "/todo", icon: CheckSquare },
    { name: "Meetings", href: "/meetings", icon: Users },
    { name: "Projects", href: "/projects", icon: Briefcase },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Automation", href: "/automation", icon: Bot },
    { name: "Guest Links", href: "/guest-links", icon: Share2 },
  ],
  creative: [
    { name: "Home", href: "/", icon: Home },
    { name: "Workspaces", href: "/workspaces", icon: Users },
    { name: "Inbox", href: "/inbox", icon: Inbox },
    { name: "Tasks", href: "/todo", icon: CheckSquare },
    { name: "Portfolio", href: "/portfolio", icon: Palette },
    { name: "Inspiration", href: "/inspiration", icon: Lightbulb },
    { name: "Projects", href: "/projects", icon: FolderOpen },
    { name: "Clients", href: "/clients", icon: UserCircle },
    { name: "Automation", href: "/automation", icon: Bot },
    { name: "Guest Links", href: "/guest-links", icon: Share2 },
  ],
  medical: [
    { name: "Home", href: "/", icon: Home },
    { name: "Workspaces", href: "/workspaces", icon: Users },
    { name: "Inbox", href: "/inbox", icon: Inbox },
    { name: "Tasks", href: "/todo", icon: CheckSquare },
    { name: "Patients", href: "/patients", icon: UserCircle },
    { name: "Shifts", href: "/shifts", icon: Clock },
    { name: "Records", href: "/records", icon: ClipboardList },
    { name: "Resources", href: "/resources", icon: Stethoscope },
    { name: "Automation", href: "/automation", icon: Bot },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ],
}

import { HydrationWrapper } from "./hydration-wrapper"

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { industry, userName } = useUser()
  const { unreadCount } = useNotifications()
  const { workspaces, currentWorkspace, loading: workspaceLoading } = useWorkspace()
  const [expandedSpaces, setExpandedSpaces] = useState<string[]>([])
  const [showFavorites, setShowFavorites] = useState(true)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = industry ? navigationByIndustry[industry] : navigationByIndustry.education

  const toggleSpace = (spaceName: string) => {
    setExpandedSpaces(prev => 
      prev.includes(spaceName) 
        ? prev.filter(s => s !== spaceName)
        : [...prev, spaceName]
    )
  }

  const navigateToWorkspaces = () => {
    router.push('/workspaces')
  }

  return (
    <HydrationWrapper>
      <>
        {/* Command Palette */}
        <CommandPalette />
        
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between z-30 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h2 className="text-foreground font-semibold text-sm">{userName || "Alba"}'s Workspace</h2>
                <p className="text-foreground/50 text-xs">Free Plan</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowCommandPalette(true)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop/Tablet Sidebar */}
      <nav className={`fixed left-0 top-0 h-screen w-16 lg:w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-20 transition-all duration-300 hidden sm:flex ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Workspace Header */}
        <div className="p-3 lg:p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div className="hidden lg:block flex-1 min-w-0">
              <h2 className="text-sidebar-foreground font-semibold text-sm truncate">{userName || "Alba"}'s Workspace</h2>
              <p className="text-sidebar-foreground/50 text-xs">Free Plan</p>
            </div>
            <button className="hidden lg:flex p-1 hover:bg-sidebar-accent rounded transition-colors">
              <ChevronDown className="w-4 h-4 text-sidebar-foreground/50" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 hidden lg:block">
          <button 
            onClick={() => setShowCommandPalette(true)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-sidebar-accent hover:bg-sidebar-accent/80 rounded-lg text-sidebar-foreground/60 text-sm transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
            <span className="ml-auto text-xs bg-sidebar/80 px-1.5 py-0.5 rounded">Ctrl K</span>
          </button>
        </div>

        {/* Main Navigation */}
        <div className="px-2 lg:px-3 py-2 space-y-0.5">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-2 lg:px-3 py-2 rounded-lg transition-all group",
                  isActive
                    ? "bg-violet-600/20 text-violet-400"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-violet-400" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80")} />
                <span className="hidden lg:block text-sm">{item.name}</span>
                {item.name === "Inbox" && unreadCount > 0 && (
                  <span className="hidden lg:flex ml-auto bg-violet-600 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </Link>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 lg:px-3 py-2">
          {/* Favorites Section */}
          <div className="mb-4">
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className="hidden lg:flex w-full items-center gap-2 px-2 py-1.5 text-xs font-medium text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors"
            >
              {showFavorites ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>FAVORITES</span>
            </button>
            {showFavorites && (
              <div className="mt-1 space-y-0.5">
                {navItems.slice(4).map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-2 lg:px-3 py-2 rounded-lg transition-all group",
                        isActive
                          ? "bg-violet-600/20 text-violet-400"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      )}
                    >
                      <Star className={cn("w-4 h-4 shrink-0", isActive ? "text-yellow-400 fill-yellow-400" : "text-sidebar-foreground/40")} />
                      <span className="hidden lg:block text-sm">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Workspaces Section */}
          <div className="hidden lg:block">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs font-medium text-sidebar-foreground/40">WORKSPACES</span>
              <button 
                onClick={navigateToWorkspaces}
                className="p-1 hover:bg-sidebar-accent rounded transition-colors"
              >
                <Plus className="w-3 h-3 text-sidebar-foreground/40" />
              </button>
            </div>
            <div className="mt-1 space-y-0.5">
              {workspaceLoading ? (
                <div className="px-2 py-2">
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ) : workspaces && workspaces.length > 0 ? (
                workspaces.map((workspace) => (
                  <div key={workspace.id}>
                    <button
                      onClick={() => toggleSpace(workspace.name)}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 transition-colors group"
                    >
                      {expandedSpaces.includes(workspace.name) ? (
                        <ChevronDown className="w-3 h-3 text-sidebar-foreground/40" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-sidebar-foreground/40" />
                      )}
                      <div className="w-2 h-2 rounded-sm bg-gradient-to-br from-violet-500 to-purple-600" />
                      <span className="text-sm flex-1 text-left">{workspace.name}</span>
                      {currentWorkspace?.id === workspace.id && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                      <MoreHorizontal className="w-4 h-4 text-sidebar-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    {expandedSpaces.includes(workspace.name) && (
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        <Link
                          href={`/workspaces/${workspace.id}`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground/80 text-sm transition-colors"
                        >
                          <Home className="w-3 h-3" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href={`/workspaces/${workspace.id}/tasks`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground/80 text-sm transition-colors"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span>Tasks</span>
                        </Link>
                        <Link
                          href={`/workspaces/${workspace.id}/members`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground/80 text-sm transition-colors"
                        >
                          <Users className="w-3 h-3" />
                          <span>Members</span>
                        </Link>
                        <Link
                          href={`/workspaces/${workspace.id}/settings`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground/80 text-sm transition-colors"
                        >
                          <Settings className="w-3 h-3" />
                          <span>Settings</span>
                        </Link>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-2 py-3">
                  <p className="text-xs text-sidebar-foreground/40 text-center">
                    No workspaces yet
                  </p>
                  <button
                    onClick={navigateToWorkspaces}
                    className="w-full mt-2 px-2 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-lg transition-colors"
                  >
                    Create Workspace
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="p-3 border-t border-sidebar-border">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-2 lg:px-3 py-2 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="hidden lg:block text-sm">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-20 sm:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors relative",
                isActive ? "text-violet-500" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
              {item.name === "Inbox" && unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-violet-600 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </Link>
          )
        })}
        {/* More button for additional items */}
        <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-muted-foreground">
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* Add top padding for mobile header */}
      <div className="lg:hidden h-16" />
      </>
    </HydrationWrapper>
  )
}
