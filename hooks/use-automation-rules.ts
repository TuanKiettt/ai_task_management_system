import { useState, useEffect } from "react"

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: string
  action: string
  isActive: boolean
  category: "task" | "deadline" | "email" | "project" | "custom"
  executions: number
  lastRun?: string
  status: "active" | "draft" | "archived"
  createdAt: string
  updatedAt: string
}

interface UseAutomationRulesReturn {
  rules: AutomationRule[]
  loading: boolean
  error: string | null
  createRule: (ruleData: Partial<AutomationRule>) => Promise<void>
  updateRule: (id: string, ruleData: Partial<AutomationRule>) => Promise<void>
  deleteRule: (id: string) => Promise<void>
  toggleRule: (id: string) => Promise<void>
  refreshRules: () => Promise<void>
}

export function useAutomationRules(userId?: string): UseAutomationRulesReturn {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRules = async () => {
    if (!userId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/automation/rules?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setRules(data.rules)
      } else {
        setError(data.error || "Failed to fetch rules")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const createRule = async (ruleData: Partial<AutomationRule>) => {
    if (!userId) return
    
    try {
      const response = await fetch("/api/automation/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ruleData, userId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchRules() // Refresh list
      } else {
        setError(data.error || "Failed to create rule")
      }
    } catch (err) {
      setError("Network error")
    }
  }

  const updateRule = async (id: string, ruleData: Partial<AutomationRule>) => {
    try {
      const response = await fetch(`/api/automation/rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setRules(prev => prev.map(rule => 
          rule.id === id ? { ...rule, ...ruleData } : rule
        ))
      } else {
        setError(data.error || "Failed to update rule")
      }
    } catch (err) {
      setError("Network error")
    }
  }

  const deleteRule = async (id: string) => {
    try {
      const response = await fetch(`/api/automation/rules/${id}`, {
        method: "DELETE"
      })
      
      const data = await response.json()
      
      if (data.success) {
        setRules(prev => prev.filter(rule => rule.id !== id))
      } else {
        setError(data.error || "Failed to delete rule")
      }
    } catch (err) {
      setError("Network error")
    }
  }

  const toggleRule = async (id: string) => {
    const rule = rules.find(r => r.id === id)
    if (rule) {
      await updateRule(id, { isActive: !rule.isActive })
    }
  }

  useEffect(() => {
    fetchRules()
  }, [userId])

  return {
    rules,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    refreshRules: fetchRules
  }
}
