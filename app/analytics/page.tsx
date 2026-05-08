"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts"
import { 
  TrendingUp, TrendingDown, Calendar, Users, CheckCircle, Clock, 
  AlertTriangle, Target, Activity, Download, Filter
} from "lucide-react"
import { useTasks } from "@/context/task-context"
import { useUser } from "@/context/user-context"

interface AnalyticsData {
  taskStats: {
    total: number
    completed: number
    inProgress: number
    overdue: number
    completionRate: number
  }
  productivityTrend: Array<{
    date: string
    completed: number
    created: number
  }>
  categoryDistribution: Array<{
    category: string
    count: number
    percentage: number
  }>
  priorityDistribution: Array<{
    priority: string
    count: number
  }>
  weeklyActivity: Array<{
    day: string
    tasks: number
    completed: number
  }>
  timeTracking: {
    avgCompletionTime: string
    totalEstimated: string
    efficiency: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AnalyticsPage() {
  const { tasks } = useTasks()
  const { userData } = useUser()
  const [timeRange, setTimeRange] = useState("30d")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calculateAnalytics()
  }, [tasks, timeRange])

  const calculateAnalytics = () => {
    setLoading(true)
    
    // Filter tasks based on time range
    const now = new Date()
    const filterDate = new Date()
    switch (timeRange) {
      case "7d":
        filterDate.setDate(now.getDate() - 7)
        break
      case "30d":
        filterDate.setDate(now.getDate() - 30)
        break
      case "90d":
        filterDate.setDate(now.getDate() - 90)
        break
      default:
        filterDate.setDate(now.getDate() - 30)
    }

    const filteredTasks = tasks.filter(task => 
      new Date(task.createdAt) >= filterDate
    )

    // Calculate task statistics
    const total = filteredTasks.length
    const completed = filteredTasks.filter(t => t.status === 'done').length
    const inProgress = filteredTasks.filter(t => t.status === 'processing').length
    const overdue = filteredTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
    ).length
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    // Calculate productivity trend
    const trendData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      const dayTasks = filteredTasks.filter(t => 
        new Date(t.createdAt).toDateString() === date.toDateString()
      )
      const dayCompleted = dayTasks.filter(t => t.status === 'done').length
      
      trendData.push({
        date: dateStr,
        created: dayTasks.length,
        completed: dayCompleted
      })
    }

    // Calculate category distribution
    const categoryMap = new Map<string, number>()
    filteredTasks.forEach(task => {
      categoryMap.set(task.category, (categoryMap.get(task.category) || 0) + 1)
    })
    
    const categoryDistribution = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count).slice(0, 5)

    // Calculate priority distribution
    const priorityMap = new Map<string, number>()
    filteredTasks.forEach(task => {
      priorityMap.set(task.priority, (priorityMap.get(task.priority) || 0) + 1)
    })
    
    const priorityDistribution = Array.from(priorityMap.entries()).map(([priority, count]) => ({
      priority,
      count
    }))

    // Calculate weekly activity
    const weeklyData = []
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = now.getDay()
    
    for (let i = 0; i < 7; i++) {
      const dayIndex = (today - i + 7) % 7
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const dayTasks = filteredTasks.filter(t => 
        new Date(t.createdAt).toDateString() === date.toDateString()
      )
      const dayCompleted = dayTasks.filter(t => t.status === 'done').length
      
      weeklyData.unshift({
        day: days[dayIndex],
        tasks: dayTasks.length,
        completed: dayCompleted
      })
    }

    // Calculate time tracking metrics
    const completedTasksWithTime = filteredTasks.filter(t => 
      t.status === 'done' && t.completedAt && t.estimatedTime
    )
    
    let avgCompletionTime = 'N/A'
    let totalEstimated = '0h'
    let efficiency = 0
    
    if (completedTasksWithTime.length > 0) {
      const totalHours = completedTasksWithTime.reduce((sum, task) => {
        const match = task.estimatedTime?.match(/(\d+)/)
        return sum + (match ? parseInt(match[1]) : 0)
      }, 0)
      
      totalEstimated = `${totalHours}h`
      efficiency = completedTasksWithTime.length > 0 ? 
        Math.round((completedTasksWithTime.length / filteredTasks.length) * 100) : 0
    }

    setAnalyticsData({
      taskStats: {
        total,
        completed,
        inProgress,
        overdue,
        completionRate
      },
      productivityTrend: trendData,
      categoryDistribution,
      priorityDistribution,
      weeklyActivity: weeklyData,
      timeTracking: {
        avgCompletionTime,
        totalEstimated,
        efficiency
      }
    })

    setLoading(false)
  }

  const exportAnalytics = () => {
    if (!analyticsData) return
    
    const dataStr = JSON.stringify(analyticsData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `analytics-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Activity className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Data Available</h2>
            <p className="text-muted-foreground">Start creating tasks to see analytics.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Track your productivity and task management insights
            </p>
          </div>
          
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={exportAnalytics}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.taskStats.total}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analyticsData.taskStats.completed}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.taskStats.completionRate.toFixed(1)}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{analyticsData.taskStats.inProgress}</div>
              <p className="text-xs text-muted-foreground">
                Active tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analyticsData.taskStats.overdue}</div>
              <p className="text-xs text-muted-foreground">
                Needs attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Productivity Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Productivity Trend</CardTitle>
              <CardDescription>Tasks created vs completed over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.productivityTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="created" stroke="#8884d8" name="Created" />
                  <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Task Categories</CardTitle>
              <CardDescription>Distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analyticsData.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Task activity this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#8884d8" name="Created" />
                  <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
              <CardDescription>Tasks by priority level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.priorityDistribution} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="priority" type="category" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
