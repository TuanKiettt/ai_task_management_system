"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, Trash2, ExternalLink } from "lucide-react"
import { useUser } from "@/context/user-context"
import { useNotifications } from "@/context/notification-context"

interface OverdueTask {
  id: string
  title: string
  description?: string
  dueDate: string
  status: string
  category: string
  priority: string
  workspace?: {
    id: string
    name: string
  }
  deletionTime: string
  hoursUntilDeletion: number
  isOverdue: boolean
  deletionStatus: string
}

interface OverdueTasksWarningProps {
  className?: string
}

export function OverdueTasksWarning({ className }: OverdueTasksWarningProps) {
  const { userData } = useUser()
  const { addNotification } = useNotifications()
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [notificationsCreated, setNotificationsCreated] = useState<Set<string>>(new Set())

  // Get today's date string for localStorage key
  const getTodayKey = () => {
    const today = new Date().toISOString().split('T')[0]
    return `overdue-notifications-${userData?.id}-${today}`
  }

  // Check if notifications were already created today
  const getTodayNotifications = () => {
    if (typeof window === 'undefined') return new Set<string>()
    const key = getTodayKey()
    const stored = localStorage.getItem(key)
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set<string>()
  }

  // Save today's notifications to localStorage
  const saveTodayNotifications = (notifications: Set<string>) => {
    if (typeof window === 'undefined') return
    const key = getTodayKey()
    localStorage.setItem(key, JSON.stringify(Array.from(notifications)))
  }

  useEffect(() => {
    if (!userData?.id) return

    const fetchOverdueTasks = async () => {
      try {
        const response = await fetch(`/api/tasks/overdue?userId=${userData.id}`)
        if (response.ok) {
          const data = await response.json()
          setOverdueTasks(data.tasks)
          
          // Create notifications for overdue tasks
          if (data.tasks && data.tasks.length > 0) {
            await createOverdueTaskNotifications(data.tasks)
          }
        }
      } catch (error) {
        console.error('Failed to fetch overdue tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    const createOverdueTaskNotifications = async (tasks: OverdueTask[]) => {
      if (!userData?.id) return
      
      // Check if notifications were already created today
      const todayNotifications = getTodayNotifications()
      
      // Check if we already created summary notification today
      if (todayNotifications.has('summary')) {
        console.log('Pending deletion notifications already created today, skipping')
        return
      }
      
      // Additional check: verify no similar notifications exist in database
      try {
        const response = await fetch(`/api/notifications?userId=${userData.id}`)
        if (response.ok) {
          const data = await response.json()
          const existingNotifications = data.notifications || []
          
          // Check if we already have a pending deletion notification from today
          const today = new Date().toISOString().split('T')[0]
          const hasRecentPendingDeletionNotif = existingNotifications.some((notif: any) => 
            notif.title.includes('Tasks Pending Deletion') && 
            notif.category === 'reminder' &&
            notif.timestamp && new Date(notif.timestamp).toISOString().split('T')[0] === today
          )
          
          // If we already have the notification today, don't create duplicates
          if (hasRecentPendingDeletionNotif) {
            console.log('Recent pending deletion notification already exists, skipping creation')
            // Update localStorage to reflect this
            const updatedNotifications = new Set(todayNotifications)
            updatedNotifications.add('summary')
            saveTodayNotifications(updatedNotifications)
            setNotificationsCreated(updatedNotifications)
            return
          }
        }
      } catch (error) {
        console.error('Error checking existing notifications:', error)
        // Continue with creation if check fails
      }
      
      const criticalTasks = tasks.filter(t => t.hoursUntilDeletion <= 1)
      const urgentTasks = tasks.filter(t => t.hoursUntilDeletion <= 6 && t.hoursUntilDeletion > 1)
      
      // Create summary notification only if it doesn't exist
      if (tasks.length > 0) {
        const message = tasks.length === 1 
          ? `You have 1 task pending deletion: "${tasks[0].title}". It will be ${tasks[0].deletionStatus.toLowerCase()}.`
          : `You have ${tasks.length} tasks pending deletion. ${criticalTasks.length} critical (${criticalTasks.length > 0 ? 'will be deleted within 1 hour' : ''})`
        
        await addNotification({
          title: "⚠️ Tasks Pending Deletion",
          message,
          type: criticalTasks.length > 0 ? "error" : "warning",
          category: "reminder"
        })
        
        // Update localStorage and state
        const updatedNotifications = new Set(todayNotifications)
        updatedNotifications.add('summary')
        saveTodayNotifications(updatedNotifications)
        setNotificationsCreated(updatedNotifications)
        
        // Create individual notifications for critical tasks (but check localStorage first)
        for (const task of criticalTasks) {
          if (!todayNotifications.has(task.id)) {
            await addNotification({
              title: "🚨 Critical: Task Deletion Imminent",
              message: `"${task.title}" will be deleted within 1 hour. Complete it now to save your work!`,
              type: "error",
              category: "reminder"
            })
            
            // Update localStorage for this task
            const taskUpdatedNotifications = new Set(updatedNotifications)
            taskUpdatedNotifications.add(task.id)
            saveTodayNotifications(taskUpdatedNotifications)
            setNotificationsCreated(taskUpdatedNotifications)
          }
        }
      }
    }

    fetchOverdueTasks()
  }, [userData?.id, addNotification, notificationsCreated])

  if (loading) {
    return null
  }

  if (overdueTasks.length === 0) {
    return null
  }

  const criticalTasks = overdueTasks.filter(t => t.hoursUntilDeletion <= 1)
  const urgentTasks = overdueTasks.filter(t => t.hoursUntilDeletion <= 6 && t.hoursUntilDeletion > 1)

  return (
    <Card className={`border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <AlertTriangle className="w-5 h-5" />
          Tasks Pending Deletion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-orange-700 dark:text-orange-300">
          {criticalTasks.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="destructive" className="text-xs">
                {criticalTasks.length} Critical
              </Badge>
              <span>Will be deleted within 1 hour</span>
            </div>
          )}
          {urgentTasks.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs bg-orange-200 text-orange-800">
                {urgentTasks.length} Urgent
              </Badge>
              <span>Will be deleted within 6 hours</span>
            </div>
          )}
          <p className="text-xs">
            Tasks are automatically deleted 24 hours after their due date if not completed.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
          >
            {showDetails ? 'Hide' : 'Show'} Details ({overdueTasks.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>

        {showDetails && (
          <div className="space-y-2 border-t border-orange-200 dark:border-orange-800 pt-3">
            {overdueTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0">
                  {task.hoursUntilDeletion <= 1 ? (
                    <Trash2 className="w-4 h-4 text-red-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-orange-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium truncate">{task.title}</h4>
                    {task.workspace && (
                      <Badge variant="outline" className="text-xs">
                        {task.workspace.name}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                    <div className="font-medium text-orange-600 dark:text-orange-400">
                      {task.deletionStatus}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    // Navigate to task if possible
                    if (task.workspace) {
                      window.location.href = `/workspaces/${task.workspace.id}/tasks`
                    } else {
                      window.location.href = '/todo'
                    }
                  }}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
