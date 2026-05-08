"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Download,
  FileText,
  Archive,
  Calendar,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FolderOpen
} from "lucide-react"

interface BatchExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId?: string
  workspaceId?: string
}

interface ExportOption {
  id: string
  title: string
  description: string
  icon: string
  formats: string[]
  enabled: boolean
}

interface ExportProgress {
  current: string
  completed: number
  total: number
  status: 'preparing' | 'exporting' | 'packaging' | 'completed' | 'error'
  error?: string
}

const exportOptions: ExportOption[] = [
  {
    id: "tasks",
    title: "Tasks Data",
    description: "Complete task information with status, priority, and metadata",
    icon: "FileText",
    formats: ["csv", "json", "xlsx"],
    enabled: true
  },
  {
    id: "analytics",
    title: "Analytics Reports",
    description: "Performance metrics, completion rates, and team analytics",
    icon: "BarChart3",
    formats: ["pdf", "json"],
    enabled: true
  },
  {
    id: "team_performance",
    title: "Team Performance",
    description: "Individual member efficiency and contribution metrics",
    icon: "Users",
    formats: ["csv", "pdf"],
    enabled: false
  },
  {
    id: "time_tracking",
    title: "Time Tracking",
    description: "Task completion times and deadline analysis",
    icon: "Clock",
    formats: ["csv", "json"],
    enabled: false
  },
  {
    id: "project_status",
    title: "Project Status",
    description: "Current project progress and milestone tracking",
    icon: "FolderOpen",
    formats: ["pdf", "json"],
    enabled: false
  },
  {
    id: "activity_log",
    title: "Activity Log",
    description: "Complete audit trail of all activities and changes",
    icon: "Calendar",
    formats: ["csv", "json"],
    enabled: false
  }
]

const availablePeriods = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
  { value: "all", label: "All time" }
]

const availableFormats = [
  { value: "csv", label: "CSV", description: "Spreadsheet format" },
  { value: "json", label: "JSON", description: "Data format" },
  { value: "xlsx", label: "Excel", description: "Excel spreadsheet" },
  { value: "pdf", label: "PDF", description: "Report format" },
  { value: "zip", label: "ZIP", description: "Compressed archive" }
]

export function BatchExportModal({ open, onOpenChange, userId, workspaceId }: BatchExportModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<ExportOption[]>(exportOptions)
  const [selectedPeriod, setSelectedPeriod] = useState("30d")
  const [selectedFormat, setSelectedFormat] = useState("zip")
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null)

  const handleOptionToggle = (optionId: string, enabled: boolean) => {
    setSelectedOptions(prev => 
      prev.map(option => 
        option.id === optionId ? { ...option, enabled } : option
      )
    )
  }

  const getExportIcon = (iconName: string) => {
    switch (iconName) {
      case "FileText": return <FileText className="w-5 h-5" />
      case "BarChart3": return <BarChart3 className="w-5 h-5" />
      case "Users": return <Users className="w-5 h-5" />
      case "Clock": return <Clock className="w-5 h-5" />
      case "FolderOpen": return <FolderOpen className="w-5 h-5" />
      case "Calendar": return <Calendar className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const simulateExport = async () => {
    const enabledOptions = selectedOptions.filter(o => o.enabled)
    
    setExportProgress({
      current: "Preparing export...",
      completed: 0,
      total: enabledOptions.length,
      status: 'preparing'
    })

    // Simulate export process
    for (let i = 0; i < enabledOptions.length; i++) {
      const option = enabledOptions[i]
      
      setExportProgress({
        current: `Exporting ${option.title}...`,
        completed: i,
        total: enabledOptions.length,
        status: 'exporting'
      })

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      setExportProgress({
        current: `Completed ${option.title}`,
        completed: i + 1,
        total: enabledOptions.length,
        status: i === enabledOptions.length - 1 ? 'packaging' : 'exporting'
      })
    }

    // Packaging phase
    setExportProgress({
      current: "Packaging files...",
      completed: enabledOptions.length,
      total: enabledOptions.length,
      status: 'packaging'
    })

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Download phase
    setExportProgress({
      current: "Preparing download...",
      completed: enabledOptions.length,
      total: enabledOptions.length,
      status: 'completed'
    })

    // Trigger download
    const blob = new Blob(['Batch export data'], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch-export-${new Date().toISOString().split('T')[0]}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setTimeout(() => {
      setIsExporting(false)
      setExportProgress(null)
      onOpenChange(false)
    }, 1000)
  }

  const handleExport = async () => {
    const enabledOptions = selectedOptions.filter(o => o.enabled)
    if (enabledOptions.length === 0) {
      alert("Please select at least one export option")
      return
    }

    setIsExporting(true)
    await simulateExport()
  }

  const getProgressPercentage = () => {
    if (!exportProgress) return 0
    return (exportProgress.completed / exportProgress.total) * 100
  }

  const getStatusIcon = () => {
    if (!exportProgress) return <Download className="w-5 h-5" />
    
    switch (exportProgress.status) {
      case 'preparing':
      case 'exporting':
      case 'packaging':
        return <Loader2 className="w-5 h-5 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      default:
        return <Download className="w-5 h-5" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1a1f2e]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Archive className="w-6 h-6 text-violet-600" />
            Batch Export
          </DialogTitle>
        </DialogHeader>

        {!isExporting ? (
          <div className="space-y-6">
            {/* Export Settings */}
            <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
              <CardHeader>
                <CardTitle className="text-lg">Export Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="period">Time Period</Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePeriods.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="format">Output Format</Label>
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFormats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            <div>
                              <div>{format.label}</div>
                              <div className="text-xs text-gray-500">{format.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Select Data to Export</span>
                  <Badge variant="secondary">
                    {selectedOptions.filter(o => o.enabled).length} selected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        option.enabled
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-gray-200 dark:border-[#2d3548] bg-white dark:bg-[#1a1f2e]'
                      }`}
                      onClick={() => handleOptionToggle(option.id, !option.enabled)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={option.enabled}
                          onCheckedChange={(checked) => handleOptionToggle(option.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`p-1 rounded ${
                              option.enabled ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              {getExportIcon(option.icon)}
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {option.title}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {option.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {option.formats.map((format) => (
                              <Badge key={format} variant="outline" className="text-xs">
                                {format.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export Summary */}
            {selectedOptions.some(o => o.enabled) && (
              <Card className="bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
                <CardContent className="pt-6">
                  <h4 className="font-medium text-violet-900 dark:text-violet-100 mb-3">Export Summary:</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Period:</span>
                      <span className="font-medium">
                        {availablePeriods.find(p => p.value === selectedPeriod)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span className="font-medium">
                        {availableFormats.find(f => f.value === selectedFormat)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Items to export:</span>
                      <span className="font-medium">
                        {selectedOptions.filter(o => o.enabled).length} files
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Export Progress */
          <div className="space-y-6">
            <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    {getStatusIcon()}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {exportProgress?.current}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {exportProgress?.completed} of {exportProgress?.total} files processed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Progress value={getProgressPercentage()} className="w-full" />
                    <p className="text-sm text-gray-500">
                      {Math.round(getProgressPercentage())}% complete
                    </p>
                  </div>

                  {exportProgress?.status === 'completed' && (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span>Download started automatically</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          {!isExporting ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleExport}
                disabled={!selectedOptions.some(o => o.enabled)}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Archive className="w-4 h-4 mr-2" />
                Export Files
              </Button>
            </>
          ) : (
            <Button disabled className="bg-violet-600 text-white">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
