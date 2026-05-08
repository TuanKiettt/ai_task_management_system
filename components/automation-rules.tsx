"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  Mail,
  Users
} from "lucide-react"
import { useAutomationRules } from "@/hooks/use-automation-rules"
import { useUser } from "@/context/user-context"
import { AutomationRuleModal } from "./automation-rule-modal"
import { useParams } from "next/navigation"

export function AutomationRules() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)
  const { userId } = useUser()
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const { rules, loading, error, deleteRule, toggleRule, createRule, updateRule } = useAutomationRules(userId || undefined)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading automation rules...</span>
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "task": return <CheckCircle className="w-4 h-4" />
      case "deadline": return <AlertTriangle className="w-4 h-4" />
      case "email": return <Mail className="w-4 h-4" />
      case "project": return <Users className="w-4 h-4" />
      default: return <Settings className="w-4 h-4" />
    }
  }

  const handleCreateRule = () => {
    setEditingRule(null)
    setShowCreateForm(true)
  }

  const handleEditRule = (rule: any) => {
    setEditingRule(rule)
    setShowCreateForm(true)
  }

  const handleSaveRule = async (ruleData: any) => {
    try {
      if (editingRule) {
        await updateRule(editingRule.id, ruleData)
      } else {
        await createRule(ruleData)
      }
      setShowCreateForm(false)
      setEditingRule(null)
    } catch (error) {
      console.error("Error saving rule:", error)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "task": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case "deadline": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      case "email": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "project": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-violet-600" />
            Automation Rules
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create automated workflows to save time and improve productivity
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rules.filter(r => r.isActive).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rules.reduce((sum, rule) => sum + rule.executions, 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Executions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24/7</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rules.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {rule.name}
                    </h3>
                    <Badge className={getCategoryColor(rule.category)}>
                      <div className="flex items-center gap-1">
                        {getCategoryIcon(rule.category)}
                        {rule.category}
                      </div>
                    </Badge>
                    {rule.isActive && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {rule.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 dark:bg-[#2d3548] rounded">
                        <Info className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Trigger</p>
                        <p className="text-sm text-gray-900 dark:text-white">{rule.trigger}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 dark:bg-[#2d3548] rounded">
                        <Play className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Action</p>
                        <p className="text-sm text-gray-900 dark:text-white">{rule.action}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{rule.executions} executions</span>
                    {rule.lastRun && <span>Last run: {rule.lastRun}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRule(rule.id)}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Automation Rule Modal */}
      <AutomationRuleModal
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        userId={userId || undefined}
        workspaceId={workspaceId}
        onSave={handleSaveRule}
        editingRule={editingRule}
      />
    </div>
  )
}
