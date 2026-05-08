"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Bot, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  Clock, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2,
  Zap,
  Target,
  Filter,
  Mail,
  FileText,
  Users,
  Bell,
  Save
} from "lucide-react"

interface AutomationRuleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId?: string
  workspaceId?: string
  onSave?: (rule: any) => void
  editingRule?: any
}

const triggerTypes = [
  { 
    id: "task_created", 
    label: "Task Created", 
    description: "When a new task is created",
    icon: "Plus",
    category: "task"
  },
  { 
    id: "task_completed", 
    label: "Task Completed", 
    description: "When a task is marked as done",
    icon: "CheckCircle",
    category: "task"
  },
  { 
    id: "task_overdue", 
    label: "Task Overdue", 
    description: "When a task passes its deadline",
    icon: "AlertTriangle",
    category: "deadline"
  },
  { 
    id: "deadline_approaching", 
    label: "Deadline Approaching", 
    description: "When deadline is within X hours",
    icon: "Clock",
    category: "deadline"
  },
  { 
    id: "new_team_member", 
    label: "New Team Member", 
    description: "When someone joins the workspace",
    icon: "Users",
    category: "project"
  },
  { 
    id: "project_milestone", 
    label: "Project Milestone", 
    description: "When project reaches X% completion",
    icon: "Target",
    category: "project"
  },
  { 
    id: "scheduled", 
    label: "Scheduled", 
    description: "Run on a schedule (daily, weekly, etc.)",
    icon: "Calendar",
    category: "custom"
  },
  { 
    id: "webhook", 
    label: "Webhook", 
    description: "Triggered by external system",
    icon: "Zap",
    category: "custom"
  }
]

const actionTypes = [
  { 
    id: "send_email", 
    label: "Send Email", 
    description: "Send notification email",
    icon: "Mail",
    category: "notification"
  },
  { 
    id: "send_notification", 
    label: "Send Notification", 
    description: "Send in-app notification",
    icon: "Bell",
    category: "notification"
  },
  { 
    id: "assign_task", 
    label: "Assign Task", 
    description: "Auto-assign task to someone",
    icon: "Users",
    category: "task"
  },
  { 
    id: "update_status", 
    label: "Update Status", 
    description: "Change task status",
    icon: "CheckCircle",
    category: "task"
  },
  { 
    id: "create_task", 
    label: "Create Task", 
    description: "Create a new task",
    icon: "Plus",
    category: "task"
  },
  { 
    id: "generate_report", 
    label: "Generate Report", 
    description: "Create and send report",
    icon: "FileText",
    category: "report"
  },
  { 
    id: "webhook_call", 
    label: "Webhook Call", 
    description: "Call external API",
    icon: "Zap",
    category: "custom"
  },
  { 
    id: "filter_tasks", 
    label: "Filter Tasks", 
    description: "Apply filters to task list",
    icon: "Filter",
    category: "task"
  }
]

const schedules = [
  { id: "daily", label: "Daily", time: "09:00 AM" },
  { id: "weekly", label: "Weekly", time: "Monday 09:00 AM" },
  { id: "monthly", label: "Monthly", time: "1st of month 09:00 AM" },
  { id: "hourly", label: "Hourly", time: "Every hour" }
]

const sampleUsers = [
  { id: "user1", name: "John Doe", email: "john@company.com" },
  { id: "user2", name: "Jane Smith", email: "jane@company.com" },
  { id: "user3", name: "Mike Johnson", email: "mike@company.com" }
]

export function AutomationRuleModal({ open, onOpenChange, userId, workspaceId, onSave, editingRule }: AutomationRuleModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger: "",
    action: "",
    category: "task" as "task" | "deadline" | "email" | "project" | "custom",
    schedule: "daily",
    recipients: [] as string[],
    conditions: [] as string[],
    isActive: true,
    priority: "medium" as "low" | "medium" | "high"
  })

  const [isSaving, setIsSaving] = useState(false)

  const getTriggerIcon = (iconName: string) => {
    switch (iconName) {
      case "Plus": return <Plus className="w-5 h-5" />
      case "CheckCircle": return <CheckCircle className="w-5 h-5" />
      case "AlertTriangle": return <AlertTriangle className="w-5 h-5" />
      case "Clock": return <Clock className="w-5 h-5" />
      case "Users": return <Users className="w-5 h-5" />
      case "Target": return <Target className="w-5 h-5" />
      case "Calendar": return <Calendar className="w-5 h-5" />
      case "Zap": return <Zap className="w-5 h-5" />
      default: return <Bot className="w-5 h-5" />
    }
  }

  const getActionIcon = (iconName: string) => {
    switch (iconName) {
      case "Mail": return <Mail className="w-5 h-5" />
      case "Bell": return <Bell className="w-5 h-5" />
      case "Users": return <Users className="w-5 h-5" />
      case "CheckCircle": return <CheckCircle className="w-5 h-5" />
      case "Plus": return <Plus className="w-5 h-5" />
      case "FileText": return <FileText className="w-5 h-5" />
      case "Zap": return <Zap className="w-5 h-5" />
      case "Filter": return <Filter className="w-5 h-5" />
      default: return <Settings className="w-5 h-5" />
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.trigger || !formData.action) {
      alert("Please fill in all required fields")
      return
    }

    setIsSaving(true)
    try {
      const endpoint = editingRule ? `/api/automation/rules/${editingRule.id}` : '/api/automation/rules'
      const method = editingRule ? 'PUT' : 'POST'
      
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
        const result = await response.json()
        onSave?.(result.rule || result)
        onOpenChange(false)
        
        // Reset form
        setFormData({
          name: "",
          description: "",
          trigger: "",
          action: "",
          category: "task",
          schedule: "daily",
          recipients: [],
          conditions: [],
          isActive: true,
          priority: "medium"
        })
      } else {
        alert("Failed to save automation rule")
      }
    } catch (error) {
      console.error("Error saving rule:", error)
      alert("Error saving automation rule")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRecipientToggle = (recipientId: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.includes(recipientId)
        ? prev.recipients.filter(r => r !== recipientId)
        : [...prev.recipients, recipientId]
    }))
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "task": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case "deadline": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
      case "email": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "project": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1a1f2e]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="w-6 h-6 text-violet-600" />
            {editingRule ? "Edit Automation Rule" : "Create Automation Rule"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Rule Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Send daily task summary"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What this automation does..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trigger Selection */}
          <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
            <CardHeader>
              <CardTitle className="text-lg">Trigger</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {triggerTypes.map((trigger) => (
                  <div
                    key={trigger.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      formData.trigger === trigger.id
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-gray-200 dark:border-[#2d3548] bg-white dark:bg-[#1a1f2e]'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, trigger: trigger.id, category: trigger.category as any }))}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${
                        formData.trigger === trigger.id ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        {getTriggerIcon(trigger.icon)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {trigger.label}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {trigger.description}
                        </p>
                        <Badge className={`mt-1 ${getCategoryColor(trigger.category)}`}>
                          {trigger.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {formData.trigger === "scheduled" && (
                <div className="mt-4">
                  <Label htmlFor="schedule">Schedule</Label>
                  <Select value={formData.schedule} onValueChange={(value) => setFormData(prev => ({ ...prev, schedule: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {schedules.map((schedule) => (
                        <SelectItem key={schedule.id} value={schedule.id}>
                          <div>
                            <div>{schedule.label}</div>
                            <div className="text-xs text-gray-500">{schedule.time}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Selection */}
          <Card className="bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]">
            <CardHeader>
              <CardTitle className="text-lg">Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actionTypes.map((action) => (
                  <div
                    key={action.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      formData.action === action.id
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-gray-200 dark:border-[#2d3548] bg-white dark:bg-[#1a1f2e]'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, action: action.id }))}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${
                        formData.action === action.id ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        {getActionIcon(action.icon)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {action.label}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {action.description}
                        </p>
                        <Badge className={`mt-1 ${getCategoryColor(action.category)}`}>
                          {action.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recipients for email/notification actions */}
              {(formData.action === "send_email" || formData.action === "send_notification") && (
                <div className="mt-4">
                  <Label>Recipients</Label>
                  <div className="mt-2 space-y-2">
                    {sampleUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`recipient-${user.id}`}
                          checked={formData.recipients.includes(user.id)}
                          onCheckedChange={() => handleRecipientToggle(user.id)}
                        />
                        <Label
                          htmlFor={`recipient-${user.id}`}
                          className="cursor-pointer"
                        >
                          <div>
                            <div>{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
            <CardContent className="pt-6">
              <h4 className="font-medium text-violet-900 dark:text-violet-100 mb-3">Rule Preview</h4>
              <div className="text-center py-4">
                <Bot className="w-12 h-12 mx-auto mb-4 text-violet-600" />
                <h3 className="text-lg font-medium text-violet-900 dark:text-violet-100 mb-2">
                  {formData.name || "Untitled Rule"}
                </h3>
                <p className="text-violet-700 dark:text-violet-300 mb-4">
                  {formData.description || "Custom automation rule"}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {formData.trigger && (
                    <Badge variant="secondary">
                      {getTriggerIcon(triggerTypes.find(t => t.id === formData.trigger)?.icon || "Bot")}
                      {triggerTypes.find(t => t.id === formData.trigger)?.label}
                    </Badge>
                  )}
                  {formData.action && (
                    <Badge variant="secondary">
                      {getActionIcon(actionTypes.find(a => a.id === formData.action)?.icon || "Settings")}
                      {actionTypes.find(a => a.id === formData.action)?.label}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {formData.category}
                  </Badge>
                  <Badge variant="outline">
                    {formData.priority} priority
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving || !formData.name || !formData.trigger || !formData.action}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editingRule ? "Update Rule" : "Create Rule"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
