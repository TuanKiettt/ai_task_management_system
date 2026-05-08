"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { 
  Filter,
  Calendar as CalendarIcon,
  Users,
  Tag,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  RotateCcw,
  Search
} from "lucide-react"
import { format } from "date-fns"

interface AdvancedFiltersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplyFilters: (filters: any) => void
  currentFilters?: any
}

interface FilterState {
  dateRange: {
    start: Date | undefined
    end: Date | undefined
  }
  statuses: string[]
  priorities: string[]
  categories: string[]
  assignedTo: string[]
  tags: string[]
  searchQuery: string
  hasDueDate: boolean | undefined
  isOverdue: boolean | undefined
}

const availableStatuses = [
  { id: "new", label: "New", color: "bg-gray-500" },
  { id: "processing", label: "In Progress", color: "bg-blue-500" },
  { id: "done", label: "Completed", color: "bg-green-500" },
  { id: "urgent", label: "Urgent", color: "bg-red-500" }
]

const availablePriorities = [
  { id: "Low", label: "Low", color: "bg-gray-400" },
  { id: "Medium", label: "Medium", color: "bg-yellow-500" },
  { id: "High", label: "High", color: "bg-orange-500" },
  { id: "Urgent", label: "Urgent", color: "bg-red-500" }
]

const availableCategories = [
  "Development", "Design", "Marketing", "Sales", "Support", 
  "Research", "Planning", "Testing", "Documentation", "Other"
]

const sampleUsers = [
  { id: "user1", name: "John Doe" },
  { id: "user2", name: "Jane Smith" },
  { id: "user3", name: "Mike Johnson" },
  { id: "user4", name: "Sarah Wilson" }
]

export function AdvancedFiltersModal({ open, onOpenChange, onApplyFilters, currentFilters }: AdvancedFiltersModalProps) {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      start: undefined,
      end: undefined
    },
    statuses: [],
    priorities: [],
    categories: [],
    assignedTo: [],
    tags: [],
    searchQuery: "",
    hasDueDate: undefined,
    isOverdue: undefined
  })

  const [showCalendar, setShowCalendar] = useState(false)

  const handleStatusToggle = (statusId: string) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(statusId)
        ? prev.statuses.filter(s => s !== statusId)
        : [...prev.statuses, statusId]
    }))
  }

  const handlePriorityToggle = (priorityId: string) => {
    setFilters(prev => ({
      ...prev,
      priorities: prev.priorities.includes(priorityId)
        ? prev.priorities.filter((p: string) => p !== priorityId)
        : [...prev.priorities, priorityId]
    }))
  }

  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleUserToggle = (userId: string) => {
    setFilters(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(u => u !== userId)
        : [...prev.assignedTo, userId]
    }))
  }

  const resetFilters = () => {
    setFilters({
      dateRange: { start: undefined, end: undefined },
      statuses: [],
      priorities: [],
      categories: [],
      assignedTo: [],
      tags: [],
      searchQuery: "",
      hasDueDate: undefined,
      isOverdue: undefined
    })
  }

  const applyFilters = () => {
    onApplyFilters(filters)
    onOpenChange(false)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.dateRange.start || filters.dateRange.end) count++
    if (filters.statuses.length > 0) count++
    if (filters.priorities.length > 0) count++
    if (filters.categories.length > 0) count++
    if (filters.assignedTo.length > 0) count++
    if (filters.searchQuery) count++
    if (filters.hasDueDate !== undefined) count++
    if (filters.isOverdue !== undefined) count++
    return count
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1a1f2e]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-6 h-6 text-violet-600" />
              Advanced Filters
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary">{getActiveFiltersCount()} active</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search */}
          <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search tasks by title or description..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Date Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Select start date"
                      value={filters.dateRange.start ? format(filters.dateRange.start, "PPP") : ""}
                      readOnly
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="cursor-pointer mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="text"
                    placeholder="Select end date"
                    value={filters.dateRange.end ? format(filters.dateRange.end, "PPP") : ""}
                    readOnly
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="cursor-pointer mt-1"
                  />
                </div>
              </div>
              
              {showCalendar && (
                <div className="mt-4 p-4 border border-gray-200 dark:border-[#2d3548] rounded-lg bg-white dark:bg-[#1a1f2e]">
                  <Calendar
                    mode="range"
                    selected={{
                      from: filters.dateRange.start,
                      to: filters.dateRange.end
                    }}
                    onSelect={(range) => {
                      setFilters(prev => ({
                        ...prev,
                        dateRange: {
                          start: range?.from,
                          end: range?.to
                        }
                      }))
                      setShowCalendar(false)
                    }}
                    className="mx-auto"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availableStatuses.map((status) => (
                    <div key={status.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status.id}`}
                        checked={filters.statuses.includes(status.id)}
                        onCheckedChange={() => handleStatusToggle(status.id)}
                      />
                      <Label
                        htmlFor={`status-${status.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className={`w-3 h-3 rounded-full ${status.color}`} />
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availablePriorities.map((priority) => (
                    <div key={priority.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${priority.id}`}
                        checked={filters.priorities.includes(priority.id)}
                        onCheckedChange={() => handlePriorityToggle(priority.id)}
                      />
                      <Label
                        htmlFor={`priority-${priority.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className={`w-3 h-3 rounded-full ${priority.color}`} />
                        {priority.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Categories & Users */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {availableCategories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={filters.categories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      <Label
                        htmlFor={`category-${category}`}
                        className="text-sm cursor-pointer"
                      >
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Assigned To
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sampleUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={filters.assignedTo.includes(user.id)}
                        onCheckedChange={() => handleUserToggle(user.id)}
                      />
                      <Label
                        htmlFor={`user-${user.id}`}
                        className="cursor-pointer"
                      >
                        {user.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Filters */}
          <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Additional Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Due Date</Label>
                  <Select 
                    value={filters.hasDueDate?.toString() || "any"} 
                    onValueChange={(value) => {
                      const val = value === "any" ? undefined : value === "true"
                      setFilters(prev => ({ ...prev, hasDueDate: val }))
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="true">Has Due Date</SelectItem>
                      <SelectItem value="false">No Due Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Overdue Status</Label>
                  <Select 
                    value={filters.isOverdue?.toString() || "any"} 
                    onValueChange={(value) => {
                      const val = value === "any" ? undefined : value === "true"
                      setFilters(prev => ({ ...prev, isOverdue: val }))
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="true">Overdue</SelectItem>
                      <SelectItem value="false">Not Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Filters Summary */}
          {getActiveFiltersCount() > 0 && (
            <Card className="bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
              <CardContent className="pt-6">
                <h4 className="font-medium text-violet-900 dark:text-violet-100 mb-3">Active Filters:</h4>
                <div className="flex flex-wrap gap-2">
                  {filters.searchQuery && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Search className="w-3 h-3" />
                      Search: "{filters.searchQuery}"
                    </Badge>
                  )}
                  {filters.dateRange.start && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      From: {format(filters.dateRange.start, "MMM d")}
                    </Badge>
                  )}
                  {filters.dateRange.end && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      To: {format(filters.dateRange.end, "MMM d")}
                    </Badge>
                  )}
                  {filters.statuses.map(status => {
                    const statusInfo = availableStatuses.find(s => s.id === status)
                    return (
                      <Badge key={status} variant="secondary">
                        {statusInfo?.label}
                      </Badge>
                    )
                  })}
                  {filters.priorities.map(priority => (
                    <Badge key={priority} variant="secondary">
                      {priority}
                    </Badge>
                  ))}
                  {filters.categories.map(category => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={applyFilters}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
