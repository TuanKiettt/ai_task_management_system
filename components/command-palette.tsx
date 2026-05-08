"use client"

import * as React from "react"
import { Calendar, Settings, User, Sparkles, BookOpen, Users, Briefcase, FileText, Palette, Lightbulb, UserCircle, ClipboardList, Stethoscope, GraduationCap, FolderOpen, Clock, CheckSquare, Inbox, Bot, Share2, BarChart3 } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useUser } from "@/context/user-context"
import { useRouter } from "next/navigation"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [searchQuery, setSearchQuery] = React.useState("")
  const { industry } = useUser()
  const router = useRouter()

  const industryActions = {
    education: [
      { id: "summarize-today", label: "Tóm tắt công việc ngày hôm nay", icon: Sparkles, href: "/todo", category: "ai" },
      { id: "plan-math", label: "Lên kế hoạch bài giảng Toán cho tuần sau", icon: Sparkles, href: "/learning", category: "ai" },
      { id: "grade-assignments", label: "Chấm bài tập", icon: BookOpen, href: "/assignments", category: "ai" },
      { id: "view-timetable", label: "Xem thời khóa biểu", icon: Calendar, href: "/timetable", category: "navigation" },
      { id: "view-assignments", label: "Xem bài tập", icon: BookOpen, href: "/assignments", category: "navigation" },
      { id: "view-learning", label: "Xem khóa học", icon: GraduationCap, href: "/learning", category: "navigation" },
      { id: "view-events", label: "Xem sự kiện", icon: Calendar, href: "/events", category: "navigation" },
      { id: "view-automation", label: "Xem quy tắc tự động", icon: Bot, href: "/automation", category: "navigation" },
      { id: "view-reports", label: "Xem báo cáo", icon: BarChart3, href: "/reports", category: "navigation" },
    ],
    corporate: [
      { id: "summarize-meetings", label: "Tóm tắt cuộc họp hôm nay", icon: Sparkles, href: "/meetings", category: "ai" },
      { id: "generate-report", label: "Tạo báo cáo tuần", icon: Sparkles, href: "/reports", category: "ai" },
      { id: "view-meetings", label: "Xem cuộc họp", icon: Users, href: "/meetings", category: "navigation" },
      { id: "view-projects", label: "Xem dự án", icon: Briefcase, href: "/projects", category: "navigation" },
      { id: "view-reports", label: "Xem báo cáo", icon: FileText, href: "/reports", category: "navigation" },
      { id: "view-events", label: "Xem sự kiện", icon: Calendar, href: "/events", category: "navigation" },
      { id: "view-automation", label: "Xem quy tắc tự động", icon: Bot, href: "/automation", category: "navigation" },
      { id: "view-guest-links", label: "Xem guest links", icon: Share2, href: "/guest-links", category: "navigation" },
    ],
    creative: [
      { id: "generate-ideas", label: "Tạo ý tưởng mới", icon: Sparkles, href: "/inspiration", category: "ai" },
      { id: "portfolio-update", label: "Cập nhật portfolio", icon: Sparkles, href: "/portfolio", category: "ai" },
      { id: "view-portfolio", label: "Xem portfolio", icon: Palette, href: "/portfolio", category: "navigation" },
      { id: "view-inspiration", label: "Xem nguồn cảm hứng", icon: Lightbulb, href: "/inspiration", category: "navigation" },
      { id: "view-projects", label: "Xem dự án", icon: FolderOpen, href: "/projects", category: "navigation" },
      { id: "view-clients", label: "Xem khách hàng", icon: UserCircle, href: "/clients", category: "navigation" },
      { id: "view-automation", label: "Xem quy tắc tự động", icon: Bot, href: "/automation", category: "navigation" },
      { id: "view-guest-links", label: "Xem guest links", icon: Share2, href: "/guest-links", category: "navigation" },
    ],
    medical: [
      { id: "patient-summary", label: "Tóm tắt bệnh án", icon: Sparkles, href: "/patients", category: "ai" },
      { id: "schedule-review", label: "Xem lịch làm việc", icon: Sparkles, href: "/shifts", category: "ai" },
      { id: "view-patients", label: "Xem bệnh nhân", icon: UserCircle, href: "/patients", category: "navigation" },
      { id: "view-shifts", label: "Xem ca làm việc", icon: Clock, href: "/shifts", category: "navigation" },
      { id: "view-records", label: "Xem hồ sơ bệnh án", icon: ClipboardList, href: "/records", category: "navigation" },
      { id: "view-resources", label: "Xem tài nguyên y tế", icon: Stethoscope, href: "/resources", category: "navigation" },
      { id: "view-automation", label: "Xem quy tắc tự động", icon: Bot, href: "/automation", category: "navigation" },
      { id: "view-reports", label: "Xem báo cáo", icon: BarChart3, href: "/reports", category: "navigation" },
    ],
  }

  const commonActions = [
    { id: "view-tasks", label: "Xem danh sách công việc", icon: CheckSquare, href: "/todo", category: "navigation" },
    { id: "view-inbox", label: "Xem hộp thư", icon: Inbox, href: "/inbox", category: "navigation" },
    { id: "manage-profile", label: "Quản lý hồ sơ", icon: User, href: "/settings", category: "settings" },
    { id: "system-settings", label: "Cài đặt hệ thống", icon: Settings, href: "/settings", category: "settings" },
    { id: "theme-settings", label: "Cài đặt giao diện", icon: Settings, href: "/settings", category: "settings" },
    { id: "notification-settings", label: "Cài đặt thông báo", icon: Settings, href: "/settings", category: "settings" },
  ]

  const actions = [
    ...(industry ? industryActions[industry] : industryActions.education),
    ...commonActions,
  ]

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
        setSelectedIndex(0)
        setSearchQuery("")
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Filter actions based on search query
  const filteredActions = React.useMemo(() => {
    if (!searchQuery.trim()) return actions
    
    const query = searchQuery.toLowerCase()
    return actions.filter(action => 
      action.label.toLowerCase().includes(query) ||
      action.id.toLowerCase().includes(query) ||
      action.category.toLowerCase().includes(query)
    )
  }, [searchQuery])

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [filteredActions])

  const handleActionSelect = (action: any) => {
    setOpen(false)
    router.push(action.href)
  }

  const handleAction = (actionId: string) => {
    const action = filteredActions.find(a => a.id === actionId)
    if (action) {
      handleActionSelect(action)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredActions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filteredActions.length > 0) {
        handleAction(filteredActions[selectedIndex].id)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
      setSearchQuery("")
    }
  }

  // Group filtered actions by category
  const groupedActions = React.useMemo(() => {
    const groups: Record<string, typeof actions> = {}
    filteredActions.forEach(action => {
      if (!groups[action.category]) {
        groups[action.category] = []
      }
      groups[action.category].push(action)
    })
    return groups
  }, [filteredActions])

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "ai": return "Gợi ý từ AI"
      case "navigation": return "Điều hướng"
      case "settings": return "Cài đặt"
      default: return category
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) setSearchQuery("")
    }}>
      <CommandInput 
        placeholder="Gõ lệnh hoặc hỏi Alba (Ctrl + K)..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
        onKeyDown={handleKeyDown}
      />
      <CommandList className="bg-popover text-popover-foreground border-border">
        <CommandEmpty>
          {searchQuery ? "Không tìm thấy kết quả phù hợp." : "Không tìm thấy kết quả."}
        </CommandEmpty>
        
        {Object.entries(groupedActions).map(([category, categoryActions]) => (
          <React.Fragment key={category}>
            <CommandGroup heading={getCategoryTitle(category)}>
              {categoryActions.map((action, index) => {
                const globalIndex = filteredActions.indexOf(action)
                return (
                  <CommandItem 
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    className={selectedIndex === globalIndex ? "bg-accent/50" : ""}
                  >
                    <action.icon className="mr-2 h-4 w-4 text-primary" />
                    <span>{action.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {category !== Object.keys(groupedActions)[Object.keys(groupedActions).length - 1] && (
              <CommandSeparator className="bg-border" />
            )}
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
