"use client"

import { useState, useMemo, useEffect } from "react"
import { Sparkles, Clock, Filter, Trash2, CheckCircle, Play, Plus, MoreHorizontal, Calendar, Flag, User, AlertCircle, Edit } from "lucide-react"
import { AddTaskModal } from "@/components/add-task-modal"
import { TaskAnalytics } from "@/components/task-analytics"
import { EditTaskModal } from "@/components/edit-task-modal"
import { useTasks, type Task, type TaskStatus } from "@/context/task-context"
import { useUser } from "@/context/user-context"
import { Header } from "@/components/header"
import { TodoList } from "@/components/todo-list"
import { OverdueTasksWarning } from "@/components/overdue-tasks-warning"

const TaskStatusFilters = [
  { id: "all", label: "All Tasks", color: "bg-gray-500", count: 0 },
  { id: "new", label: "To Do", color: "bg-gray-400", count: 0 },
  { id: "processing", label: "In Progress", color: "bg-blue-500", count: 0 },
  { id: "done", label: "Complete", color: "bg-green-500", count: 0 },
  { id: "urgent", label: "Urgent", color: "bg-red-500", count: 0 },
]

export default function TodoPage() {
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { tasks, addTask, updateTask, deleteTask, getTaskStats, loading, error, refreshTasks } = useTasks()
  const { userName, userId } = useUser()
  const stats = getTaskStats()

  // Fetch only personal tasks (not workspace tasks)
  useEffect(() => {
    refreshTasks('personal')
  }, [refreshTasks])

  const filteredTasks = useMemo(
    () => (selectedFilter === "all" ? tasks : tasks.filter((task) => task.status === selectedFilter)),
    [selectedFilter, tasks],
  )

  const handleAddTask = async (newTask: { title: string; tag: string; priority: string; time: string; status: TaskStatus; dueDate?: string }) => {
    await addTask({
      title: newTask.title,
      category: newTask.tag,
      priority: newTask.priority as Task["priority"],
      status: newTask.status,
      estimatedTime: newTask.time,
      dueDate: newTask.dueDate,
      workspaceId: undefined, // Explicitly set as personal task
    })
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus })
  }

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingTask(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "text-red-500"
      case "High":
        return "text-orange-500"
      case "Medium":
        return "text-yellow-500"
      default:
        return "text-blue-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-500"
      case "processing":
        return "bg-blue-500"
      case "urgent":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#13171f]">
      <Header />
      
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-[#2d3548] bg-white dark:bg-[#1a1f2e] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Tasks</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and organize your tasks</p>
          </div>
          <div className="flex items-center gap-3">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <AddTaskModal onAddTask={handleAddTask} />
          </div>
        </div>
      </div>

      {/* Overdue Tasks Warning */}
      <OverdueTasksWarning className="mx-6 mt-4" />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      )}

      {!loading && (
        <>
          {/* Filter Tabs */}
          <div className="border-b border-gray-200 dark:border-[#2d3548] bg-white dark:bg-[#1a1f2e] px-6">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TaskStatusFilters.map((filter) => {
            const count = filter.id === "all" ? stats.total : stats[filter.id as keyof typeof stats] || 0
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  selectedFilter === filter.id
                    ? "border-violet-600 text-violet-600"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <span>{filter.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  selectedFilter === filter.id 
                    ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600" 
                    : "bg-gray-100 dark:bg-[#252b3b] text-gray-500 dark:text-gray-400"
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Task List */}
          <div className="xl:col-span-3">
            {/* Task Table Header */}
            <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-gray-200 dark:border-[#2d3548] overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-[#252b3b] border-b border-gray-200 dark:border-[#2d3548] text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-4">Task Name</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-1">Due Date</div>
                <div className="col-span-1">Actions</div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-[#252b3b]">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-[#252b3b] transition-colors group"
                    >
                      {/* Task Name */}
                      <div className="col-span-4">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleStatusChange(task.id, task.status === "done" ? "new" : "done")}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 flex-shrink-0 ${
                              task.status === "done"
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-gray-300 dark:border-gray-600 hover:border-violet-500"
                            }`}
                          >
                            {task.status === "done" && <CheckCircle className="w-3 h-3" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={`font-medium truncate ${task.status === "done" ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {task.estimatedTime && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {task.estimatedTime}
                                </span>
                              )}
                              {task.isRecurring && (
                                <span className="text-xs px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded">
                                  ↻ Recurring
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="col-span-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          {task.category || 'General'}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === "done"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : task.status === "processing"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              : task.status === "urgent"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(task.status)}`} />
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                      </div>

                      {/* Priority */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority).replace('text-', 'bg-').replace('500', '100').replace('600', '100').replace('400', '100')} ${getPriorityColor(task.priority)}`}>
                          <Flag className="w-3 h-3" />
                          {task.priority}
                        </span>
                      </div>

                      {/* Due Date */}
                      <div className="col-span-1">
                        {task.dueDate ? (
                          <span className={`text-xs flex items-center gap-1 ${
                            task.dueDate < new Date().toISOString().split('T')[0] && task.status !== 'done'
                              ? 'text-red-500 font-medium'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {task.status === "new" && (
                          <button
                            onClick={() => handleStatusChange(task.id, "processing")}
                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-600 transition-colors"
                            title="Start"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditTask(task)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#252b3b] flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create a new task to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-gray-200 dark:border-[#2d3548] p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Completed</span>
                  <span className="font-semibold text-green-600">{stats.done}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">In Progress</span>
                  <span className="font-semibold text-blue-600">{stats.processing}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Urgent</span>
                  <span className="font-semibold text-red-600">{stats.urgent}</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2d3548]">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500 dark:text-gray-400">Progress</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-[#252b3b] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet-600 rounded-full transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl p-4 text-white">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" />
                AI Insights
              </h3>
              <p className="text-sm text-violet-100 leading-relaxed">
                {stats.urgent > 0 
                  ? `You have ${stats.urgent} urgent task${stats.urgent > 1 ? 's' : ''}. Focus on these first to maintain productivity.`
                  : stats.processing > 0
                    ? `Great progress! You have ${stats.processing} task${stats.processing > 1 ? 's' : ''} in progress.`
                    : "All caught up! Add new tasks to stay productive."
                }
              </p>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
      
      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
      />
    </div>
  )
}
