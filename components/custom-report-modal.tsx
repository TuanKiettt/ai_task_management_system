"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  Download,
  FileText,
  Calendar,
  Filter,
  Plus,
  X,
  Save
} from "lucide-react"

interface CustomReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId?: string
  workspaceId?: string
  onSave?: (report: any) => void
}

interface ReportMetric {
  id: string
  title: string
  description: string
  icon: string
  enabled: boolean
}

const availableMetrics: ReportMetric[] = [
  {
    id: "task_completion",
    title: "Task Completion Rate",
    description: "Percentage of tasks completed",
    icon: "Target",
    enabled: true
  },
  {
    id: "team_performance",
    title: "Team Performance",
    description: "Individual member efficiency metrics",
    icon: "Users",
    enabled: true
  },
  {
    id: "automation_efficiency",
    title: "Automation Efficiency",
    description: "Average executions per active rule",
    icon: "TrendingUp",
    enabled: false
  },
  {
    id: "guest_links",
    title: "Active Guest Links",
    description: "Currently active sharing links",
    icon: "FileText",
    enabled: false
  },
  {
    id: "generated_reports",
    title: "Generated Reports",
    description: "Available report types",
    icon: "BarChart3",
    enabled: false
  },
  {
    id: "time_tracking",
    title: "Time Tracking",
    description: "Task completion time analysis",
    icon: "Clock",
    enabled: false
  }
]

export function CustomReportModal({ open, onOpenChange, userId, workspaceId, onSave }: CustomReportModalProps) {
  const [reportName, setReportName] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [selectedMetrics, setSelectedMetrics] = useState<ReportMetric[]>(availableMetrics)
  const [reportPeriod, setReportPeriod] = useState("30d")
  const [reportFormat, setReportFormat] = useState("dashboard")
  const [isSaving, setIsSaving] = useState(false)

  const handleMetricToggle = (metricId: string, enabled: boolean) => {
    setSelectedMetrics(prev => 
      prev.map(metric => 
        metric.id === metricId ? { ...metric, enabled } : metric
      )
    )
  }

  const handleSave = async () => {
    if (!reportName.trim()) {
      alert("Please enter a report name")
      return
    }

    const enabledMetrics = selectedMetrics.filter(m => m.enabled)
    if (enabledMetrics.length === 0) {
      alert("Please select at least one metric")
      return
    }

    setIsSaving(true)

    try {
      const customReport = {
        id: `custom_${Date.now()}`,
        name: reportName,
        description: reportDescription,
        metrics: enabledMetrics,
        period: reportPeriod,
        format: reportFormat,
        userId,
        workspaceId,
        createdAt: new Date().toISOString()
      }

      // Save to database (you can implement this API endpoint)
      const response = await fetch('/api/reports/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customReport)
      })

      if (response.ok) {
        onSave?.(customReport)
        onOpenChange(false)
        // Reset form
        setReportName("")
        setReportDescription("")
        setSelectedMetrics(availableMetrics)
        setReportPeriod("30d")
        setReportFormat("dashboard")
      } else {
        alert("Failed to save report")
      }
    } catch (error) {
      console.error("Error saving report:", error)
      alert("Error saving report")
    } finally {
      setIsSaving(false)
    }
  }

  const getMetricIcon = (iconName: string) => {
    switch (iconName) {
      case "Target": return <Target className="w-5 h-5" />
      case "Users": return <Users className="w-5 h-5" />
      case "TrendingUp": return <TrendingUp className="w-5 h-5" />
      case "FileText": return <FileText className="w-5 h-5" />
      case "BarChart3": return <BarChart3 className="w-5 h-5" />
      case "Clock": return <Clock className="w-5 h-5" />
      default: return <BarChart3 className="w-5 h-5" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1a1f2e]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="w-6 h-6 text-violet-600" />
            Create Custom Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Basic Info */}
          <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
            <CardHeader>
              <CardTitle className="text-lg">Report Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportName">Report Name *</Label>
                  <Input
                    id="reportName"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="e.g., Weekly Performance Report"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="reportPeriod">Time Period</Label>
                  <Select value={reportPeriod} onValueChange={setReportPeriod}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="reportDescription">Description</Label>
                <Textarea
                  id="reportDescription"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe what this report shows..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="reportFormat">Report Format</Label>
                <Select value={reportFormat} onValueChange={setReportFormat}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard View</SelectItem>
                    <SelectItem value="summary">Summary Report</SelectItem>
                    <SelectItem value="detailed">Detailed Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Available Metrics */}
          <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Select Metrics</span>
                <Badge variant="secondary">
                  {selectedMetrics.filter(m => m.enabled).length} selected
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedMetrics.map((metric) => (
                  <div
                    key={metric.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      metric.enabled
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-gray-200 dark:border-[#2d3548] bg-white dark:bg-[#1a1f2e]'
                    }`}
                    onClick={() => handleMetricToggle(metric.id, !metric.enabled)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={metric.enabled}
                        onCheckedChange={(checked) => handleMetricToggle(metric.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`p-1 rounded ${
                            metric.enabled ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-gray-100 dark:bg-gray-800'
                          }`}>
                            {getMetricIcon(metric.icon)}
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {metric.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {metric.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {selectedMetrics.some(m => m.enabled) && (
            <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
              <CardHeader>
                <CardTitle className="text-lg">Report Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-violet-600" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {reportName || "Untitled Report"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {reportDescription || "Custom report with selected metrics"}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {selectedMetrics.filter(m => m.enabled).map((metric) => (
                      <Badge key={metric.id} variant="secondary" className="flex items-center gap-1">
                        {getMetricIcon(metric.icon)}
                        {metric.title}
                      </Badge>
                    ))}
                  </div>
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
            onClick={handleSave} 
            disabled={isSaving || !reportName.trim() || !selectedMetrics.some(m => m.enabled)}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
