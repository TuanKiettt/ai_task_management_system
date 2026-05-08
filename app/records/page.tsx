"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { FileText, Download, Lock, Search, Plus, Eye, Trash2, AlertCircle } from "lucide-react"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useRecords, type Record } from "@/context/records-context"
import Loading from "./loading"

function RecordsPageContent() {
  const { records, addRecord, updateRecord, deleteRecord, loading, error } = useRecords()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [newRecord, setNewRecord] = useState({ patient: "", type: "", date: "" })

  const filteredRecords = records.filter(record =>
    record.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddRecord = async () => {
    if (newRecord.patient && newRecord.type && newRecord.date) {
      await addRecord({
        patient: newRecord.patient,
        type: newRecord.type,
        date: new Date(newRecord.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        status: "In Progress",
        userId: "demo-user", // This should come from user context
      })
      setNewRecord({ patient: "", type: "", date: "" })
      setShowAddModal(false)
    }
  }

  const handleStatusChange = async (id: string, status: Record["status"]) => {
    await updateRecord(id, { status })
  }

  const handleDeleteRecord = async (id: string) => {
    await deleteRecord(id)
  }

  const stats = {
    total: records.length,
    completed: records.filter(r => r.status === "Completed").length,
    pending: records.filter(r => r.status === "Pending Review").length,
    inProgress: records.filter(r => r.status === "In Progress").length,
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Medical Records</h1>
              <p className="text-muted-foreground">Access and manage patient medical records securely</p>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Record
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
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card rounded-xl p-4 border text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-muted-foreground text-sm">Total Records</p>
            </div>
            <div className="bg-card rounded-xl p-4 border text-center">
              <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              <p className="text-muted-foreground text-sm">Completed</p>
            </div>
            <div className="bg-card rounded-xl p-4 border text-center">
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              <p className="text-muted-foreground text-sm">Pending Review</p>
            </div>
            <div className="bg-card rounded-xl p-4 border text-center">
              <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
              <p className="text-muted-foreground text-sm">In Progress</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          {/* Records List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="bg-card border rounded-lg p-4 hover:bg-accent/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{record.patient}</h3>
                        <p className="text-sm text-muted-foreground">{record.type}</p>
                        <p className="text-xs text-muted-foreground">{record.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === "Completed" ? "bg-green-500/20 text-green-600" :
                        record.status === "Pending Review" ? "bg-yellow-500/20 text-yellow-600" :
                        "bg-blue-500/20 text-blue-600"
                      }`}>
                        {record.status}
                      </span>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-popover rounded-2xl border w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Add New Record</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Patient Name</label>
                <input
                  type="text"
                  value={newRecord.patient}
                  onChange={(e) => setNewRecord({ ...newRecord, patient: e.target.value })}
                  placeholder="Enter patient name..."
                  className="w-full bg-background border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Record Type</label>
                <select
                  value={newRecord.type}
                  onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
                  className="w-full bg-background border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Select type...</option>
                  <option value="Lab Results">Lab Results</option>
                  <option value="X-Ray Report">X-Ray Report</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Surgery Notes">Surgery Notes</option>
                  <option value="Blood Test">Blood Test</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Date</label>
                <input
                  type="date"
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                  className="w-full bg-background border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddRecord} className="flex-1">
                  Add Record
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RecordsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RecordsPageContent />
    </Suspense>
  )
}
