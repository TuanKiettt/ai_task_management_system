"use client"

import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle, Clock, AlertCircle, Plus, Filter } from "lucide-react"
import { useState } from "react"
import { useAssignments, type Assignment } from "@/context/assignments-context"
import { useUser } from "@/context/user-context"

export default function AssignmentsPage() {
  const { assignments, addAssignment, updateAssignment, deleteAssignment, getAssignmentStats, loading, error } = useAssignments()
  const { userId } = useUser()
  
  const [filter, setFilter] = useState<"all" | Assignment["status"]>("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAssignment, setNewAssignment] = useState({ title: "", subject: "", dueDate: "" })

  const filteredAssignments = filter === "all" ? assignments : assignments.filter(a => a.status === filter)
  const assignmentStats = getAssignmentStats()

  const handleAddAssignment = async () => {
    if (newAssignment.title && newAssignment.subject && newAssignment.dueDate && userId) {
      await addAssignment({
        title: newAssignment.title,
        subject: newAssignment.subject,
        dueDate: new Date(newAssignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        status: "pending",
        userId,
      })
      setNewAssignment({ title: "", subject: "", dueDate: "" })
      setShowAddModal(false)
    }
  }

  const handleStatusChange = async (id: string, status: Assignment["status"]) => {
    await updateAssignment(id, { status })
  }

  const getStatusIcon = (status: Assignment["status"]) => {
    switch (status) {
      case "graded": return <CheckCircle className="w-5 h-5 text-green-400" />
      case "submitted": return <Clock className="w-5 h-5 text-blue-400" />
      case "overdue": return <AlertCircle className="w-5 h-5 text-red-400" />
      default: return <FileText className="w-5 h-5 text-yellow-400" />
    }
  }

  const getStatusColor = (status: Assignment["status"]) => {
    switch (status) {
      case "graded": return "bg-green-500/20 text-green-300 border-green-500/30"
      case "submitted": return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "overdue": return "bg-red-500/20 text-red-300 border-red-500/30"
      default: return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Assignments</h1>
              <p className="text-muted-foreground">Track and manage your assignments</p>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Assignment
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-5 gap-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{assignmentStats.total}</p>
              <p className="text-muted-foreground text-sm">Total</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{assignmentStats.pending}</p>
              <p className="text-muted-foreground text-sm">Pending</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{assignmentStats.submitted}</p>
              <p className="text-muted-foreground text-sm">Submitted</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{assignmentStats.graded}</p>
              <p className="text-muted-foreground text-sm">Graded</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{assignmentStats.overdue}</p>
              <p className="text-muted-foreground text-sm">Overdue</p>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {["all", "pending", "submitted", "graded", "overdue"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent border"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Assignments List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <Card
                  key={assignment.id}
                  className="p-5 hover:bg-accent/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(assignment.status)}
                    <div className="flex-1">
                      <h3 className="text-foreground font-semibold group-hover:text-primary transition-colors">
                        {assignment.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{assignment.subject}</span>
                        <span>Due: {assignment.dueDate}</span>
                        {assignment.grade && (
                          <span className="text-green-600 font-semibold">Grade: {assignment.grade}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                      {assignment.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(assignment.id, "submitted")}
                        >
                          Submit
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-popover rounded-2xl border w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Add New Assignment</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase text-primary font-semibold mb-2 block">Title</label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="Enter assignment title..."
                  className="w-full bg-background border rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-primary font-semibold mb-2 block">Subject</label>
                <input
                  type="text"
                  value={newAssignment.subject}
                  onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                  placeholder="e.g., Mathematics"
                  className="w-full bg-background border rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-primary font-semibold mb-2 block">Due Date</label>
                <input
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  className="w-full bg-background border rounded-xl px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground border hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAssignment}
                  className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Add Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
