import { useState, useEffect } from "react"

interface ReportMetric {
  title: string
  value: string | number
  change: number
  trend: "up" | "down" | "neutral"
  icon: string
  description: string
}

interface TeamPerformance {
  name: string
  completed: number
  inProgress: number
  overdue: number
  efficiency: number
}

interface ProjectStatus {
  name: string
  progress: number
  status: string
  deadline: string
}

interface AnalyticsData {
  metrics: ReportMetric[]
  teamPerformance: TeamPerformance[]
  projectStatus: ProjectStatus[]
  stats: {
    totalTasks: number
    completedTasks: number
    urgentTasks: number
    recentTasks: number
    activeRules: number
    totalExecutions: number
    activeLinks: number
    totalAccess: number
    reports: number
  }
}

interface UseAnalyticsReturn {
  data: AnalyticsData | null
  loading: boolean
  error: string | null
  refreshAnalytics: () => Promise<void>
}

export function useAnalytics(userId?: string, workspaceId?: string, period?: string): UseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    if (!userId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({ userId })
      if (workspaceId) params.append('workspaceId', workspaceId)
      if (period) params.append('period', period)
      
      const response = await fetch(`/api/analytics?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result)
      } else {
        setError(result.error || "Failed to fetch analytics")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [userId, workspaceId, period])

  return {
    data,
    loading,
    error,
    refreshAnalytics: fetchAnalytics
  }
}
