"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Calendar,
  Clock,
  Mail,
  Download,
  Plus,
  X,
  Save,
  Bell,
  Users,
  FileText,
  Repeat,
  Trash2,
  Edit
} from "lucide-react"

interface ScheduledReportsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId?: string
  workspaceId?: string
}

interface ScheduledReport {
  id: string
  name: string
  description: string
  reportType: string
  frequency: string
  recipients: string[]
  format: string
  nextRun: string
  isActive: boolean
  createdAt: string
}

const reportTypes = [
  { id: "analytics", label: "Analytics Summary", description: "Task completion and team performance" },
  { id: "team", label: "Team Performance", description: "Individual member metrics" },
  { id: "project", label: "Project Status", description: "Project progress and milestones" },
  { id: "custom", label: "Custom Report", description: "Based on your custom report" }
]

const frequencies = [
  { id: "daily", label: "Daily", time: "09:00 AM" },
  { id: "weekly", label: "Weekly", time: "Monday 09:00 AM" },
  { id: "monthly", label: "Monthly", time: "1st of month 09:00 AM" },
  { id: "quarterly", label: "Quarterly", time: "1st of quarter 09:00 AM" }
]

const formats = [
  { id: "pdf", label: "PDF Report", description: "Formatted report document" },
  { id: "csv", label: "CSV Data", description: "Raw data spreadsheet" },
  { id: "json", label: "JSON", description: "Data format for integration" }
]

const sampleRecipients = [
  { id: "user1", email: "john.doe@company.com", name: "John Doe" },
  { id: "user2", email: "jane.smith@company.com", name: "Jane Smith" },
  { id: "user3", email: "mike@company.com", name: "Mike Johnson" }
]

export function ScheduledReportsModal({ open, onOpenChange, userId, workspaceId }: ScheduledReportsModalProps) {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    {
      id: "1",
      name: "Weekly Analytics",
      description: "Weekly performance summary for the team",
      reportType: "analytics",
      frequency: "weekly",
      recipients: ["user1", "user2"],
      format: "pdf",
      nextRun: "2026-05-12T09:00:00Z",
      isActive: true,
      createdAt: "2026-05-05T10:00:00Z"
    },
    {
      id: "2", 
      name: "Monthly Team Report",
      description: "Monthly team performance metrics",
      reportType: "team",
      frequency: "monthly",
      recipients: ["user1", "user2", "user3"],
      format: "pdf",
      nextRun: "2026-06-01T09:00:00Z",
      isActive: true,
      createdAt: "2026-05-01T14:00:00Z"
    }
  ])

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    reportType: "",
    frequency: "weekly",
    recipients: [] as string[],
    format: "pdf"
  })

  const handleCreateReport = () => {
    setEditingReport(null)
    setFormData({
      name: "",
      description: "",
      reportType: "",
      frequency: "weekly",
      recipients: [],
      format: "pdf"
    })
    setShowCreateForm(true)
  }

  const handleEditReport = (report: ScheduledReport) => {
    setEditingReport(report)
    setFormData({
      name: report.name,
      description: report.description,
      reportType: report.reportType,
      frequency: report.frequency,
      recipients: report.recipients,
      format: report.format
    })
    setShowCreateForm(true)
  }

  const handleSaveReport = async () => {
    if (!formData.name || !formData.reportType) {
      alert("Please fill in required fields")
      return
    }

    try {
      const endpoint = editingReport ? `/api/scheduled-reports/${editingReport.id}` : '/api/scheduled-reports'
      const method = editingReport ? 'PUT' : 'POST'
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId,
          workspaceId
        })
      })

      if (response.ok) {
        // For now, just update local state
        if (editingReport) {
          setScheduledReports(prev => prev.map(r => 
            r.id === editingReport.id 
              ? { ...r, ...formData, updatedAt: new Date().toISOString() }
              : r
          ))
        } else {
          const newReport: ScheduledReport = {
            id: Date.now().toString(),
            ...formData,
            nextRun: calculateNextRun(formData.frequency),
            isActive: true,
            createdAt: new Date().toISOString()
          }
          setScheduledReports(prev => [...prev, newReport])
        }
        
        setShowCreateForm(false)
        alert(editingReport ? "Report updated successfully" : "Report created successfully")
      } else {
        alert("Failed to save report")
      }
    } catch (error) {
      console.error("Error saving report:", error)
      alert("Error saving report")
    }
  }

  const handleToggleActive = async (reportId: string) => {
    try {
      const response = await fetch(`/api/scheduled-reports/${reportId}/toggle`, {
        method: 'PATCH'
      })

      if (response.ok) {
        setScheduledReports(prev => prev.map(r => 
          r.id === reportId ? { ...r, isActive: !r.isActive } : r
        ))
      }
    } catch (error) {
      console.error("Error toggling report:", error)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this scheduled report?")) return

    try {
      const response = await fetch(`/api/scheduled-reports/${reportId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setScheduledReports(prev => prev.filter(r => r.id !== reportId))
      }
    } catch (error) {
      console.error("Error deleting report:", error)
      alert("Error deleting report")
    }
  }

  const calculateNextRun = (frequency: string): string => {
    const now = new Date()
    switch (frequency) {
      case "daily":
        now.setDate(now.getDate() + 1)
        now.setHours(9, 0, 0, 0)
        break
      case "weekly":
        now.setDate(now.getDate() + (7 - now.getDay() + 1) % 7)
        now.setHours(9, 0, 0, 0)
        break
      case "monthly":
        now.setMonth(now.getMonth() + 1, 1)
        now.setHours(9, 0, 0, 0)
        break
      case "quarterly":
        now.setMonth(now.getMonth() + 3, 1)
        now.setHours(9, 0, 0, 0)
        break
      default:
        now.setDate(now.getDate() + 1)
    }
    return now.toISOString()
  }

  const handleRecipientToggle = (recipientId: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.includes(recipientId)
        ? prev.recipients.filter(r => r !== recipientId)
        : [...prev.recipients, recipientId]
    }))
  }

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case "daily": return <Clock className="w-4 h-4" />
      case "weekly": return <Calendar className="w-4 h-4" />
      case "monthly": return <Calendar className="w-4 h-4" />
      case "quarterly": return <Calendar className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf": return <FileText className="w-4 h-4" />
      case "csv": return <Download className="w-4 h-4" />
      case "json": return <FileText className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1a1f2e]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bell className="w-6 h-6 text-violet-600" />
            Scheduled Reports
          </DialogTitle>
        </DialogHeader>

        {!showCreateForm ? (
          <div className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Active Reports ({scheduledReports.filter(r => r.isActive).length})
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automated reports sent to your team
                </p>
              </div>
              <Button onClick={handleCreateReport} className="bg-violet-600 hover:bg-violet-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Schedule
              </Button>
            </div>

            {/* Scheduled Reports List */}
            <div className="space-y-4">
              {scheduledReports.length === 0 ? (
                <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No scheduled reports yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Create your first automated report to stay updated
                      </p>
                      <Button onClick={handleCreateReport} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                scheduledReports.map((report) => (
                  <Card key={report.id} className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              {report.name}
                            </h4>
                            <Badge variant={report.isActive ? "default" : "secondary"}>
                              {report.isActive ? "Active" : "Paused"}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {report.description}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {reportTypes.find(t => t.id === report.reportType)?.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getFrequencyIcon(report.frequency)}
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {frequencies.find(f => f.id === report.frequency)?.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getFormatIcon(report.format)}
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {formats.find(f => f.id === report.format)?.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span>{report.recipients.length} recipients</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Next: {new Date(report.nextRun).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(report.id)}
                          >
                            {report.isActive ? "Pause" : "Resume"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditReport(report)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteReport(report.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Create/Edit Form */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingReport ? "Edit Scheduled Report" : "Create Scheduled Report"}
              </h3>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Report Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Weekly Team Performance"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="reportType">Report Type *</Label>
                <Select value={formData.reportType} onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div>
                          <div>{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What this report contains..."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((freq) => (
                      <SelectItem key={freq.id} value={freq.id}>
                        <div>
                          <div>{freq.label}</div>
                          <div className="text-xs text-gray-500">{freq.time}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="format">Export Format</Label>
                <Select value={formData.format} onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formats.map((format) => (
                      <SelectItem key={format.id} value={format.id}>
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

            <div>
              <Label>Recipients</Label>
              <div className="mt-2 space-y-2">
                {sampleRecipients.map((recipient) => (
                  <div key={recipient.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`recipient-${recipient.id}`}
                      checked={formData.recipients.includes(recipient.id)}
                      onCheckedChange={() => handleRecipientToggle(recipient.id)}
                    />
                    <Label
                      htmlFor={`recipient-${recipient.id}`}
                      className="cursor-pointer"
                    >
                      <div>
                        <div>{recipient.name}</div>
                        <div className="text-xs text-gray-500">{recipient.email}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveReport} className="bg-violet-600 hover:bg-violet-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                {editingReport ? "Update Report" : "Create Report"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
