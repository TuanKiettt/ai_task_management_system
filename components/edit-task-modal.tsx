"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useTasks, type Task, type TaskPriority, type TaskStatus } from "@/context/task-context"

interface EditTaskModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
}

const priorityOptions: TaskPriority[] = ["Low", "Medium", "High", "Urgent"]
const statusOptions: TaskStatus[] = ["new", "processing", "urgent", "done"]

export function EditTaskModal({ task, isOpen, onClose }: EditTaskModalProps) {
  const { updateTask } = useTasks()
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("Medium")
  const [status, setStatus] = useState<TaskStatus>("new")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>()

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setCategory(task.category)
      setPriority(task.priority)
      setStatus(task.status)
      setEstimatedTime(task.estimatedTime || "")
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
    }
  }, [task])

  const handleSave = async () => {
    if (!task) return

    setIsSaving(true)
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim(),
        priority,
        status,
        estimatedTime: estimatedTime.trim() || undefined,
        dueDate: dueDate ? dueDate.toISOString().split('T')[0] : undefined,
      })
      
      onClose()
    } catch (error) {
      console.error("Failed to update task:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave()
    }
  }

  if (!task) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" onKeyPress={handleKeyPress}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Edit Task</span>
            <span className="text-sm text-muted-foreground">({task.id.slice(0, 8)})</span>
          </DialogTitle>
          <DialogDescription>
            Make changes to your task. Press Ctrl+Enter to save.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="col-span-3"
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task description..."
              className="col-span-3 resize-none"
              rows={3}
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Work, Personal, etc."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          priority === "Urgent" && "bg-red-500",
                          priority === "High" && "bg-orange-500",
                          priority === "Medium" && "bg-yellow-500",
                          priority === "Low" && "bg-gray-400"
                        )} />
                        {priority}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status and Estimated Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: TaskStatus) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        {status === "new" && <span className="w-2 h-2 rounded-full bg-gray-400" />}
                        {status === "processing" && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                        {status === "urgent" && <span className="w-2 h-2 rounded-full bg-red-500" />}
                        {status === "done" && <span className="w-2 h-2 rounded-full bg-green-500" />}
                        {status.toUpperCase()}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="estimatedTime">Estimated Time</Label>
              <Input
                id="estimatedTime"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="1h, 30m, 2h 30m..."
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="grid gap-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
