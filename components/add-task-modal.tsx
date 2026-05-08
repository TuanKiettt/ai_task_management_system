"use client"

import type React from "react"

import { useState } from "react"
import { X, Plus, AlertCircle } from "lucide-react"
import { validators } from "@/lib/validation"
import { useTimetable } from "@/context/timetable-context"

interface Task {
  title: string
  tag: string
  priority: "High" | "Medium" | "Low" | "Urgent"
  time: string
  dueDate?: string
  status: "new" | "processing" | "done" | "urgent"
}

interface AddTaskModalProps {
  onAddTask: (task: Task) => void
}

interface FormErrors {
  title?: string
  time?: string
  dueDate?: string
}

interface FormData {
  title: string
  tag: string
  priority: "High" | "Medium" | "Low" | "Urgent"
  time: string
  dueDate: string
  status: "new" | "processing" | "done" | "urgent"
}

export function AddTaskModal({ onAddTask }: AddTaskModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState<FormData>({
    title: "",
    tag: "",
    priority: "Medium",
    time: "1h",
    dueDate: "",
    status: "new",
  })
  
  // Get timetable context to add task to calendar
  const { addTaskToTimetable } = useTimetable()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
    
    // Only auto-calculate due date if no due date is currently set and user is changing time
    if (name === 'time' && value && !formData.dueDate) {
      const hours = parseInt(value.replace(/[^\d]/g, ''))
      const now = new Date()
      const dueDate = new Date(now.getTime() + hours * 60 * 60 * 1000)
      setFormData((prev) => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0]
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    if (!validators.taskTitle(formData.title)) {
      newErrors.title = "Task title is required (max 200 characters)"
    }
    if (formData.time && !validators.taskTime(formData.time)) {
      newErrors.time = "Format: 1h, 30m, 45s (e.g., 2h or 30m)"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      const newTask = {
        ...formData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "demo-user", // Should get from user context
      }
      
      // Add task to task list
      onAddTask(newTask as Task)
      
      // Also add to calendar if due date exists
      if (newTask.dueDate) {
        addTaskToTimetable(newTask)
      }
      
      setFormData({
        title: "",
        tag: "",
        priority: "Medium",
        time: "1h",
        dueDate: "",
        status: "new",
      })
      setErrors({})
      setIsOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <Plus size={16} /> Add Task
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-gray-200 dark:border-[#2d3548] w-full max-w-md shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2d3548]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Task</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Task Title */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Task name</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter task name..."
                  className={`w-full bg-gray-50 dark:bg-[#252b3b] border rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.title ? "border-red-500 focus:ring-red-500/20" : "border-gray-200 dark:border-[#2d3548] focus:ring-violet-500/20 focus:border-violet-500"
                  }`}
                  required
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Task Tag */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Category</label>
                <input
                  type="text"
                  name="tag"
                  value={formData.tag}
                  onChange={handleChange}
                  placeholder="e.g., Work, Personal..."
                  className="w-full bg-gray-50 dark:bg-[#252b3b] border border-gray-200 dark:border-[#2d3548] rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>

              {/* Time & Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Time estimate</label>
                  <input
                    type="text"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    placeholder="e.g., 1h, 30m"
                    className={`w-full bg-gray-50 dark:bg-[#252b3b] border rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                      errors.time ? "border-red-500 focus:ring-red-500/20" : "border-gray-200 dark:border-[#2d3548] focus:ring-violet-500/20 focus:border-violet-500"
                    }`}
                  />
                  {errors.time && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.time}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className={`w-full bg-gray-50 dark:bg-[#252b3b] border rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                      errors.dueDate ? "border-red-500 focus:ring-red-500/20" : "border-gray-200 dark:border-[#2d3548] focus:ring-violet-500/20 focus:border-violet-500"
                    }`}
                  />
                  {errors.dueDate && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.dueDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-[#252b3b] border border-gray-200 dark:border-[#2d3548] rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                >
                  <option value="new">To Do</option>
                  <option value="processing">In Progress</option>
                  <option value="done">Complete</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-[#252b3b] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2d3548] transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors font-medium"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
