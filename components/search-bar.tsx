"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Search, Filter, X, Calendar, User, Tag } from "lucide-react"
import { useTasks } from "@/context/task-context"
import { useWorkspace } from "@/context/workspace-context"
import { useUser } from "@/context/user-context"
import type { TaskStatus, TaskPriority } from "@/context/task-context"

interface SearchFilters {
  query: string
  status?: TaskStatus
  priority?: TaskPriority
  assignedTo?: string
  category?: string
  dateRange?: {
    from?: string
    to?: string
  }
}

interface SearchBarProps {
  onSearch?: (filters: SearchFilters) => void
  onClear?: () => void
  className?: string
}

export function SearchBar({ onSearch, onClear, className }: SearchBarProps) {
  const { tasks } = useTasks()
  const { members } = useWorkspace()
  const { userData } = useUser()
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
  })
  
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Get unique categories from tasks - memoized to prevent infinite re-renders
  const categories = useMemo(() => {
    return Array.from(new Set(tasks.map(task => task.category).filter(Boolean)))
  }, [tasks])

  // Generate search suggestions
  useEffect(() => {
    if (filters.query.length < 2) {
      setSuggestions([])
      return
    }

    const query = filters.query.toLowerCase()
    const taskTitles = tasks
      .map(task => task.title)
      .filter(title => title.toLowerCase().includes(query))
      .slice(0, 5)

    const taskCategories = categories
      .filter(category => category.toLowerCase().includes(query))
      .slice(0, 3)

    setSuggestions([...taskTitles, ...taskCategories])
  }, [filters.query, tasks, categories])

  // Update active filters display
  useEffect(() => {
    const active: string[] = []
    
    if (filters.status) active.push(`Status: ${filters.status}`)
    if (filters.priority) active.push(`Priority: ${filters.priority}`)
    if (filters.assignedTo) {
      const member = members.find(m => m.userId === filters.assignedTo)
      if (member) active.push(`Assigned: ${member.user?.fullName}`)
    }
    if (filters.category) active.push(`Category: ${filters.category}`)
    if (filters.dateRange?.from || filters.dateRange?.to) {
      active.push("Date Range")
    }

    setActiveFilters(active)
  }, [filters, members])

  const handleSearch = useCallback(() => {
    onSearch?.(filters)
    setShowSuggestions(false)
  }, [filters, onSearch])

  const handleClear = useCallback(() => {
    setFilters({ query: "" })
    onClear?.()
  }, [onClear])

  const handleSuggestionClick = (suggestion: string) => {
    setFilters(prev => ({ ...prev, query: suggestion }))
    setShowSuggestions(false)
  }

  const removeFilter = (filterType: keyof SearchFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[filterType]
      return newFilters
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks, categories..."
            value={filters.query}
            onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyPress}
            className="pl-10 pr-10"
          />
          {filters.query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, query: "" }))}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-muted first:rounded-t-lg last:rounded-b-lg"
              >
                <Search className="inline w-3 h-3 mr-2 text-muted-foreground" />
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status || ""}
                  onValueChange={(value) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      status: value as TaskStatus || undefined 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="new">To Do</SelectItem>
                    <SelectItem value="processing">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={filters.priority || ""}
                  onValueChange={(value) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      priority: value as TaskPriority || undefined 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned To Filter */}
              <div>
                <label className="text-sm font-medium">Assigned To</label>
                <Select
                  value={filters.assignedTo || ""}
                  onValueChange={(value) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      assignedTo: value || undefined 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Anyone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Anyone</SelectItem>
                    <SelectItem value={userData?.id || ""}>Unassigned</SelectItem>
                    {members.filter(m => m.isActive).map((member) => (
                      <SelectItem key={member.id} value={member.userId}>
                        {member.user?.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={filters.category || ""}
                  onValueChange={(value) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      category: value || undefined 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-sm font-medium">Date Range</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.dateRange?.from || ""}
                    onChange={(e) => 
                      setFilters(prev => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          from: e.target.value || undefined,
                        }
                      }))
                    }
                  />
                  <Input
                    type="date"
                    value={filters.dateRange?.to || ""}
                    onChange={(e) => 
                      setFilters(prev => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          to: e.target.value || undefined,
                        }
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button onClick={handleSearch} size="sm">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>

        <Button variant="outline" onClick={handleClear} size="sm">
          Clear
        </Button>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {filter}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => {
                  // Remove the corresponding filter
                  if (filter.startsWith("Status:")) removeFilter("status")
                  else if (filter.startsWith("Priority:")) removeFilter("priority")
                  else if (filter.startsWith("Assigned:")) removeFilter("assignedTo")
                  else if (filter.startsWith("Category:")) removeFilter("category")
                  else if (filter === "Date Range") removeFilter("dateRange")
                }}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
