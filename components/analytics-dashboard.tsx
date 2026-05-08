"use client"

import { useMemo, useState } from "react"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Area,
  AreaChart,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useTasks } from "@/context/task-context"
import { TrendingUp, TrendingDown, CheckCircle2, Clock, AlertTriangle, Target, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

// Colors for charts - computed values, not CSS variables
const CHART_COLORS = {
  violet: "#8b5cf6",
  blue: "#3b82f6",
  green: "#22c55e",
  orange: "#f97316",
  red: "#ef4444",
  gray: "#6b7280",
}

const PRIORITY_COLORS = {
  Low: CHART_COLORS.gray,
  Medium: CHART_COLORS.blue,
  High: CHART_COLORS.orange,
  Urgent: CHART_COLORS.red,
}

const STATUS_COLORS = {
  new: CHART_COLORS.blue,
  processing: CHART_COLORS.orange,
  done: CHART_COLORS.green,
  urgent: CHART_COLORS.red,
}

export function AnalyticsDashboard() {
  const { tasks, getTaskStats, getCompletionHistory } = useTasks()
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const stats = getTaskStats()
  const completionHistory = getCompletionHistory()

  // Filter tasks based on search query
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate productivity metrics
  const metrics = useMemo(() => {
    const completedTasks = filteredTasks.filter((t) => t.status === "done")
    const totalCompleted = completedTasks.length
    const completionRate = filteredTasks.length > 0 ? Math.round((totalCompleted / filteredTasks.length) * 100) : 0

    // Average completion time (mock calculation based on created/completed dates)
    const avgCompletionTime = completedTasks.length > 0
      ? completedTasks.reduce((acc, task) => {
          if (task.completedAt && task.createdAt) {
            const diff = new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()
            return acc + diff / (1000 * 60 * 60) // hours
          }
          return acc
        }, 0) / completedTasks.length
      : 0

    // Calculate this week's completed tasks
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    startOfWeek.setHours(0, 0, 0, 0)
    
    const thisWeekCompleted = completedTasks.filter(task => 
      task.completedAt && new Date(task.completedAt) >= startOfWeek
    ).length
    
    const lastWeekCompleted = Math.max(1, Math.floor(thisWeekCompleted * 0.8)) // Mock data
    const weeklyTrend = thisWeekCompleted >= lastWeekCompleted ? "up" : "down"
    const weeklyChange = lastWeekCompleted > 0
      ? Math.abs(Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100))
      : 0

    return {
      completionRate,
      avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      thisWeekCompleted,
      weeklyTrend,
      weeklyChange,
    }
  }, [filteredTasks])

  // Priority distribution data
  const priorityData = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0, Urgent: 0 }
    filteredTasks.forEach((t) => {
      if (t.status !== "done") counts[t.priority]++
    })
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: PRIORITY_COLORS[name as keyof typeof PRIORITY_COLORS],
    }))
  }, [filteredTasks])

  // Status distribution data
  const statusData = useMemo(() => [
    { name: "To Do", value: stats.new, fill: STATUS_COLORS.new },
    { name: "In Progress", value: stats.processing, fill: STATUS_COLORS.processing },
    { name: "Completed", value: stats.done, fill: STATUS_COLORS.done },
    { name: "Urgent", value: stats.urgent, fill: STATUS_COLORS.urgent },
  ], [stats])

  // Category breakdown
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredTasks.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [filteredTasks])

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex justify-end">
        {showSearch ? (
          <div className="relative">
            <CommandInput
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Gõ lệnh hoặc hỏi Alba (Ctrl + K)..."
              className="h-10 w-64"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-6 w-6 p-0 text-muted-foreground hover:bg-accent/50"
              onClick={() => {
                setShowSearch(false)
                setSearchQuery("")
              }}
            >
              ×
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 hover:bg-accent/50 text-muted-foreground"
            onClick={() => setShowSearch(true)}
          >
            <Search className="w-4 h-4" />
            Search
          </Button>
        )}
      </div>

      {/* Search Results Info */}
      {searchQuery.trim() && (
        <div className="text-sm text-muted-foreground">
          Showing analytics for {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} matching "{searchQuery}"
        </div>
      )}
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Completion Rate"
          value={`${metrics.completionRate}%`}
          description="of all tasks completed"
          icon={<Target className="w-5 h-5" />}
          trend={metrics.completionRate >= 50 ? "up" : "down"}
          trendValue={`${metrics.completionRate >= 50 ? "+" : ""}${metrics.completionRate - 50}% vs target`}
        />
        <StatCard
          title="Completed This Week"
          value={metrics.thisWeekCompleted.toString()}
          description="tasks finished"
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend={metrics.weeklyTrend as "up" | "down"}
          trendValue={`${metrics.weeklyTrend === "up" ? "+" : "-"}${metrics.weeklyChange}% vs last week`}
        />
        <StatCard
          title="Overdue Tasks"
          value={stats.overdue.toString()}
          description="need attention"
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={stats.overdue === 0 ? "up" : "down"}
          trendValue={stats.overdue === 0 ? "All on track!" : "Review needed"}
        />
        <StatCard
          title="Avg. Completion Time"
          value={`${metrics.avgCompletionTime}h`}
          description="per task"
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trend */}
        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Completion Trend</CardTitle>
            <CardDescription>Tasks completed over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completed: { label: "Completed", color: CHART_COLORS.violet },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={completionHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.violet} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.violet} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    labelFormatter={formatDate}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke={CHART_COLORS.violet}
                    strokeWidth={2}
                    fill="url(#colorCompleted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Tasks by Category */}
        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Tasks by Category</CardTitle>
            <CardDescription>Distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Tasks", color: CHART_COLORS.violet },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={CHART_COLORS.violet} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Priority Distribution</CardTitle>
            <CardDescription>Active tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ChartContainer config={{}} className="h-[180px] w-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="flex-1 space-y-2">
                {priorityData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Overview */}
        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Status Overview</CardTitle>
            <CardDescription>Current task status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ChartContainer config={{}} className="h-[180px] w-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="flex-1 space-y-2">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend?: "up" | "down"
  trendValue?: string
}) {
  return (
    <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          </div>
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
            {icon}
          </div>
        </div>
        {trend && trendValue && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            {trend === "up" ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            <span className={trend === "up" ? "text-green-500" : "text-red-500"}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
