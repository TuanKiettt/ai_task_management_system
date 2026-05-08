"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  CheckSquare, 
  Square, 
  Plus, 
  MoreHorizontal, 
  GripVertical,
  Trash2,
  Edit2
} from "lucide-react"
import { useSubtasks, type Subtask } from "@/context/subtask-context"
import { useUser } from "@/context/user-context"

interface TaskSubtasksProps {
  taskId: string
  className?: string
}

export function TaskSubtasks({ taskId, className }: TaskSubtasksProps) {
  const { 
    subtasks, 
    createSubtask, 
    updateSubtask, 
    deleteSubtask, 
    toggleSubtaskComplete,
    getSubtaskProgress,
    loading 
  } = useSubtasks()
  
  const { userData } = useUser()
  const [isAdding, setIsAdding] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const taskSubtasks = getSubtaskProgress(taskId)
  const subtaskList = subtasks.filter(s => s.parentTaskId === taskId).sort((a, b) => a.position - b.position)

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return

    try {
      await createSubtask(taskId, newSubtaskTitle.trim())
      setNewSubtaskTitle("")
      setIsAdding(false)
    } catch (error) {
      console.error('Failed to add subtask:', error)
      alert('Failed to add subtask')
    }
  }

  const handleToggleComplete = async (subtask: Subtask) => {
    try {
      await toggleSubtaskComplete(subtask.id)
    } catch (error) {
      console.error('Failed to toggle subtask:', error)
    }
  }

  const handleDelete = async (subtask: Subtask) => {
    if (!confirm(`Delete subtask "${subtask.title}"?`)) return

    try {
      await deleteSubtask(subtask.id)
    } catch (error) {
      console.error('Failed to delete subtask:', error)
      alert('Failed to delete subtask')
    }
  }

  const startEdit = (subtask: Subtask) => {
    setEditingId(subtask.id)
    setEditTitle(subtask.title)
  }

  const saveEdit = async (subtask: Subtask) => {
    if (!editTitle.trim()) return

    try {
      await updateSubtask(subtask.id, { 
        title: editTitle.trim(),
        updatedAt: new Date()
      })
      setEditingId(null)
      setEditTitle("")
    } catch (error) {
      console.error('Failed to update subtask:', error)
      alert('Failed to update subtask')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle("")
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4" />
          <h3 className="font-semibold">Subtasks</h3>
          <span className="text-sm text-muted-foreground">
            ({taskSubtasks.completed}/{taskSubtasks.total})
          </span>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Subtask
        </Button>
      </div>

      {/* Progress Bar */}
      {taskSubtasks.total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{taskSubtasks.percentage}%</span>
          </div>
          <Progress value={taskSubtasks.percentage} className="h-2" />
        </div>
      )}

      {/* Add Subtask Form */}
      {isAdding && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter subtask title..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddSubtask()
                  } else if (e.key === 'Escape') {
                    setIsAdding(false)
                    setNewSubtaskTitle("")
                  }
                }}
                autoFocus
                className="flex-1"
              />
              <Button onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>
                Add
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subtasks List */}
      <div className="space-y-2">
        {subtaskList.map((subtask) => (
          <Card key={subtask.id} className="p-4">
            <div className="flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
              
              <Checkbox
                checked={subtask.completed}
                onCheckedChange={() => handleToggleComplete(subtask)}
              />
              
              <div className="flex-1">
                {editingId === subtask.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveEdit(subtask)
                        } else if (e.key === 'Escape') {
                          cancelEdit()
                        }
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => saveEdit(subtask)}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`${
                      subtask.completed 
                        ? "line-through text-muted-foreground" 
                        : ""
                    }`}>
                      {subtask.title}
                    </span>
                  </div>
                )}
              </div>
              
              {editingId !== subtask.id && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(subtask)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(subtask)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}

        {subtaskList.length === 0 && !isAdding && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No subtasks yet</p>
            <p className="text-xs">Click "Add Subtask" to break down this task</p>
          </div>
        )}

        {loading && subtaskList.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            Loading subtasks...
          </div>
        )}
      </div>
    </div>
  )
}
