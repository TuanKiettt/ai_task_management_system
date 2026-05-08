"use client"

import { useMemo } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Target, Zap, Clock, Trophy, Calendar } from "lucide-react"
import type { Task } from "@/context/task-context"

interface TaskAnalyticsProps {
  tasks: Task[]
}

export function TaskAnalytics({ tasks }: TaskAnalyticsProps) {
  // Memoize all calculations to prevent unnecessary recalculations
  const analytics = useMemo(() => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status === "done").length
    const inProgressTasks = tasks.filter((t) => t.status === "processing").length
    const newTasks = tasks.filter((t) => t.status === "new").length
    const urgentTasks = tasks.filter((t) => t.status === "urgent").length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Calculate priority distribution
    const priorityData = [
      { name: "Urgent", value: tasks.filter((t) => t.priority === "Urgent").length },
      { name: "High", value: tasks.filter((t) => t.priority === "High").length },
      { name: "Medium", value: tasks.filter((t) => t.priority === "Medium").length },
      { name: "Low", value: tasks.filter((t) => t.priority === "Low").length },
    ].filter((item) => item.value > 0)

    // Calculate status distribution
    const statusData = [
      { name: "New", value: newTasks, fill: "#3b82f6" },
      { name: "Processing", value: inProgressTasks, fill: "#f59e0b" },
      { name: "Done", value: completedTasks, fill: "#10b981" },
      { name: "Urgent", value: urgentTasks, fill: "#ef4444" },
    ].filter((item) => item.value > 0)

    // Calculate category distribution
    const categoryData = tasks
      .reduce(
        (acc, task) => {
          const existing = acc.find((item) => item.name === task.category)
          if (existing) {
            existing.value += 1
          } else {
            acc.push({ name: task.category, value: 1 })
          }
          return acc
        },
        [] as Array<{ name: string; value: number }>,
      )
      .sort((a, b) => b.value - a.value)

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      newTasks,
      urgentTasks,
      completionRate,
      priorityData,
      statusData,
      categoryData,
    }
  }, [tasks])

  // Colors for priority chart
  const priorityColors: Record<string, string> = {
    Urgent: "#ef4444",
    High: "#f97316",
    Medium: "#eab308",
    Low: "#3b82f6",
  }

  const categoryColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6", "#f59e0b"]

  // Empty state
  if (analytics.totalTasks === 0) {
    return (
      <Card className="bg-[#0a122a] border-blue-700/30 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <Target className="w-12 h-12 text-blue-400/40 mx-auto mb-4" />
          <p className="text-blue-200 text-lg">No tasks yet</p>
          <p className="text-blue-300/60 text-sm mt-1">Create your first task to see analytics</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/40 to-blue-900/20 border-blue-700/30 backdrop-blur-sm hover:border-blue-600/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-xs uppercase tracking-wide font-semibold">Total Tasks</p>
                <p className="text-white text-3xl font-bold mt-1 transition-all duration-500">{analytics.totalTasks}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-colors">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/40 to-green-900/20 border-green-700/30 backdrop-blur-sm hover:border-green-600/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: "50ms" }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-xs uppercase tracking-wide font-semibold">Completed</p>
                <p className="text-white text-3xl font-bold mt-1 transition-all duration-500">{analytics.completedTasks}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg hover:bg-green-500/30 transition-colors">
                <Trophy className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/40 to-yellow-900/20 border-yellow-700/30 backdrop-blur-sm hover:border-yellow-600/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: "100ms" }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-xs uppercase tracking-wide font-semibold">In Progress</p>
                <p className="text-white text-3xl font-bold mt-1 transition-all duration-500">{analytics.inProgressTasks}</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-lg hover:bg-yellow-500/30 transition-colors">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 border-purple-700/30 backdrop-blur-sm hover:border-purple-600/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: "150ms" }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-xs uppercase tracking-wide font-semibold">Completion Rate</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-white text-3xl font-bold transition-all duration-500">{analytics.completionRate}</p>
                  <p className="text-purple-300 text-sm">%</p>
                </div>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition-colors">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        {analytics.statusData.length > 0 && (
          <Card className="bg-[#0a122a] border-blue-700/30 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Task Status Distribution
              </h3>
              <div className="w-full h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.statusData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="name" stroke="#93c5fd" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#93c5fd" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f1729",
                        border: "1px solid #1e3a5f",
                        borderRadius: "8px",
                        padding: "8px 12px",
                      }}
                      labelStyle={{ color: "#93c5fd" }}
                      formatter={(value: number) => [`${value} tasks`, "Count"]}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={true}>
                      {analytics.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Priority Distribution */}
        {analytics.priorityData.length > 0 && (
          <Card className="bg-[#0a122a] border-blue-700/30 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "100ms" }}>
            <CardContent className="p-6">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                Priority Distribution
              </h3>
              <div className="w-full h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      isAnimationActive={true}
                    >
                      {analytics.priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={priorityColors[entry.name as keyof typeof priorityColors]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f1729",
                        border: "1px solid #1e3a5f",
                        borderRadius: "8px",
                        padding: "8px 12px",
                      }}
                      labelStyle={{ color: "#93c5fd" }}
                      formatter={(value: number) => [`${value} tasks`, "Count"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {analytics.priorityData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 p-2 bg-blue-900/20 rounded hover:bg-blue-900/40 transition-colors">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: priorityColors[item.name as keyof typeof priorityColors] }}
                    />
                    <span className="text-sm text-blue-200">{item.name}</span>
                    <span className="text-sm text-blue-400 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Breakdown */}
        {analytics.categoryData.length > 0 && (
          <Card className="bg-[#0a122a] border-blue-700/30 backdrop-blur-sm lg:col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "200ms" }}>
            <CardContent className="p-6">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Tasks by Category
              </h3>
              <div className="w-full h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.categoryData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis type="number" stroke="#93c5fd" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" stroke="#93c5fd" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f1729",
                        border: "1px solid #1e3a5f",
                        borderRadius: "8px",
                        padding: "8px 12px",
                      }}
                      labelStyle={{ color: "#93c5fd" }}
                      formatter={(value: number) => [`${value} tasks`, "Count"]}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} isAnimationActive={true} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Insights Section */}
      <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700/30 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "300ms" }}>
        <CardContent className="p-6">
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Productivity Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30 hover:border-blue-600/50 hover:bg-blue-900/30 transition-all duration-300">
              <p className="text-blue-300 text-xs uppercase tracking-wide font-semibold">Average Priority</p>
              <p className="text-white text-2xl font-bold mt-2 transition-all duration-300">
                {analytics.totalTasks > 0
                  ? tasks.filter((t) => t.priority === "Urgent" || t.priority === "High").length > analytics.totalTasks / 2
                    ? "High"
                    : "Medium"
                  : "N/A"}
              </p>
            </div>
            <div className="p-4 bg-green-900/20 rounded-lg border border-green-700/30 hover:border-green-600/50 hover:bg-green-900/30 transition-all duration-300">
              <p className="text-green-300 text-xs uppercase tracking-wide font-semibold">Most Used Category</p>
              <p className="text-white text-2xl font-bold mt-2 truncate transition-all duration-300">
                {analytics.categoryData.length > 0 ? analytics.categoryData[0].name : "N/A"}
              </p>
            </div>
            <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-700/30 hover:border-purple-600/50 hover:bg-purple-900/30 transition-all duration-300">
              <p className="text-purple-300 text-xs uppercase tracking-wide font-semibold">Total Tasks</p>
              <p className="text-white text-2xl font-bold mt-2 transition-all duration-300">{analytics.totalTasks}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
