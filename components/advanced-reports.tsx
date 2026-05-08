"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Target,
  Download,
  Filter,
  Calendar,
  Activity,
  CheckCircle,
  AlertTriangle,
  FileText,
  PieChart,
  LineChart,
  Loader2
} from "lucide-react"
import { useAnalytics } from "@/hooks/use-analytics"
import { useUser } from "@/context/user-context"
import { useParams } from "next/navigation"
import { CustomReportModal } from "./custom-report-modal"
import { AdvancedFiltersModal } from "./advanced-filters-modal"
import { BatchExportModal } from "./batch-export-modal"
import { ScheduledReportsModal } from "./scheduled-reports-modal"

export function AdvancedReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d")
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const { userId } = useUser()
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const { data, loading, error } = useAnalytics(userId || undefined, workspaceId, selectedPeriod)
  
  // Modal states
  const [showCustomReportModal, setShowCustomReportModal] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [showBatchExportModal, setShowBatchExportModal] = useState(false)
  const [showScheduledReportsModal, setShowScheduledReportsModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading analytics data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertTriangle className="w-8 h-8 text-red-600" />
        <span className="ml-2 text-red-600">Error: {error}</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertTriangle className="w-8 h-8 text-gray-400" />
        <span className="ml-2 text-gray-600">No analytics data available</span>
      </div>
    )
  }

  const getTrendIcon = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-green-600" />
      case "down": return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "at-risk": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
      case "delayed": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "performance": return <BarChart3 className="w-4 h-4" />
      case "productivity": return <TrendingUp className="w-4 h-4" />
      case "engagement": return <Users className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Target": return <Target className="w-5 h-5" />
      case "TrendingUp": return <TrendingUp className="w-5 h-5" />
      case "FileText": return <FileText className="w-5 h-5" />
      case "Clock": return <Clock className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  const handleExportReport = async () => {
    if (!userId || !data) return
    
    setIsExporting(true)
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          workspaceId,
          period: selectedPeriod,
          format: 'csv'
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        alert('Failed to export report')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting report')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCreateCustomReport = () => {
    setShowCustomReportModal(true)
  }

  const handleAdvancedFilters = () => {
    setShowFiltersModal(true)
  }

  const handleBatchExport = () => {
    setShowBatchExportModal(true)
  }

  const handleCustomReportSave = (report: any) => {
    console.log('Custom report saved:', report)
  }

  const handleApplyFilters = (filters: any) => {
    console.log('Applied filters:', filters)
    alert(`Filters applied: ${JSON.stringify(filters, null, 2)}`)
  }

  const handleScheduledReports = () => {
    setShowScheduledReportsModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-violet-600" />
            Advanced Reports
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive analytics and insights for data-driven decisions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-[#2d3548] rounded-lg bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button 
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleExportReport}
            disabled={isExporting || !data}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.metrics.map((metric, index) => (
          <Card key={index} className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                  {getIconComponent(metric.icon)}
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  metric.trend === "up" ? "text-green-600" : 
                  metric.trend === "down" ? "text-red-600" : "text-gray-600"
                }`}>
                  {getTrendIcon(metric.trend)}
                  <span className="font-medium">
                    {metric.change > 0 ? "+" : ""}{metric.change}%
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {metric.value}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {metric.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team Performance Chart */}
      <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-600" />
            Team Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.teamPerformance.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#2d3548] rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{member.name}</h4>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {member.efficiency}% efficiency
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {member.completed} completed
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {member.inProgress} in progress
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {member.overdue} overdue
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full h-2 bg-gray-200 dark:bg-[#1a1f2e] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-300"
                      style={{ width: `${member.efficiency}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-600" />
              Project Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.projectStatus.map((project, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-[#2d3548] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace("-", " ")}
                    </Badge>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="text-gray-900 dark:text-white">{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-[#1a1f2e] rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          project.status === "on-track" ? "bg-green-500" :
                          project.status === "at-risk" ? "bg-orange-500" : "bg-red-500"
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Deadline: {project.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548] cursor-pointer hover:shadow-md transition-shadow"
          onClick={handleScheduledReports}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-violet-600" />
              Scheduled Reports
              <Badge variant="secondary">2 Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <PieChart className="w-12 h-12 mx-auto mb-2 text-violet-600" />
                <p className="font-medium text-gray-900 dark:text-white">2 Active Schedules</p>
                <p className="text-sm">Click to manage automated reports</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Weekly Analytics</span>
                  <span className="text-violet-600 font-medium">Next: Mon 9:00 AM</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Monthly Team Report</span>
                  <span className="text-violet-600 font-medium">Next: Jun 1</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={handleCreateCustomReport}
            >
              <LineChart className="w-6 h-6 text-violet-600" />
              <span>Create Custom Report</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={handleAdvancedFilters}
            >
              <Filter className="w-6 h-6 text-violet-600" />
              <span>Advanced Filters</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={handleBatchExport}
            >
              <Download className="w-6 h-6 text-violet-600" />
              <span>Batch Export</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CustomReportModal
        open={showCustomReportModal}
        onOpenChange={setShowCustomReportModal}
        userId={userId || undefined}
        workspaceId={workspaceId}
        onSave={handleCustomReportSave}
      />

      <AdvancedFiltersModal
        open={showFiltersModal}
        onOpenChange={setShowFiltersModal}
        onApplyFilters={handleApplyFilters}
        currentFilters={{}}
      />

      <BatchExportModal
        open={showBatchExportModal}
        onOpenChange={setShowBatchExportModal}
        userId={userId || undefined}
        workspaceId={workspaceId}
      />

      <ScheduledReportsModal
        open={showScheduledReportsModal}
        onOpenChange={setShowScheduledReportsModal}
        userId={userId || undefined}
        workspaceId={workspaceId}
      />
    </div>
  )
}
