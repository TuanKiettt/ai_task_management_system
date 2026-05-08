'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Check, X, Download, Plus, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TrainingExample {
  id: string
  user_input: string
  model_output: string
  status: 'pending' | 'approved' | 'rejected'
  created_by: string
  created_at: string
  reviewed_at?: string
  notes?: string
}

interface Stats {
  pending: number
  approved: number
  rejected: number
  total: number
}

export default function TrainingPage() {
  const [examples, setExamples] = useState<TrainingExample[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadTrainingData()
  }, [filter])

  const loadTrainingData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/training?filter=${filter}`)
      if (!response.ok) throw new Error('Failed to load training data')
      
      const data = await response.json()
      setExamples(data.examples || [])
      setStats(data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 })
    } catch (error) {
      console.error('[v0] Failed to load training data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateExampleStatus = async (id: string, status: 'approved' | 'rejected', note?: string) => {
    try {
      const response = await fetch('/api/admin/training', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes: note || notes[id] || '' }),
      })

      if (!response.ok) throw new Error('Failed to update example')
      
      setExamples(examples.map(ex => ex.id === id ? { ...ex, status, reviewed_at: new Date().toISOString() } : ex))
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        [status]: prev[status] + 1,
      }))
    } catch (error) {
      console.error('[v0] Failed to update example:', error)
    }
  }

  const exportToJsonl = async () => {
    try {
      setExporting(true)
      const response = await fetch('/api/admin/training/export?format=jsonl')
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `training-data-${new Date().toISOString().split('T')[0]}.jsonl`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[v0] Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const exportToCsv = async () => {
    try {
      setExporting(true)
      const response = await fetch('/api/admin/training/export?format=csv')
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `training-data-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[v0] Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const filteredExamples = examples.filter(ex => filter === 'all' || ex.status === filter)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">ML Training Data Manager</h1>
          <p className="text-muted-foreground">Review and approve training examples for model fine-tuning</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'bg-blue-500' },
            { label: 'Pending Review', value: stats.pending, color: 'bg-yellow-500' },
            { label: 'Approved', value: stats.approved, color: 'bg-green-500' },
            { label: 'Rejected', value: stats.rejected, color: 'bg-red-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-3 h-3 rounded-full', stat.color)} />
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={exportToCsv}
              disabled={exporting || examples.length === 0}
              className="gap-2"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={exportToJsonl}
              disabled={exporting || examples.length === 0}
              className="gap-2"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export JSONL
            </Button>
          </div>
        </div>

        {/* Training Examples */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredExamples.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No training examples found</p>
            </div>
          ) : (
            filteredExamples.map(example => {
              const tasks = JSON.parse(example.model_output).tasks || []
              const isExpanded = expandedId === example.id

              return (
                <div key={example.id} className="bg-card border border-border rounded-lg overflow-hidden">
                  {/* Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : example.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          example.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                          example.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        )}>
                          {example.status.charAt(0).toUpperCase() + example.status.slice(1)}
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(example.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-foreground font-medium truncate">{example.user_input}</p>
                      <p className="text-xs text-muted-foreground mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''} extracted</p>
                    </div>
                    <ChevronDown className={cn('w-5 h-5 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                  </button>

                  {/* Details */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 bg-muted/50">
                      <div className="space-y-4">
                        {/* Original Input */}
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase">User Input</label>
                          <p className="text-sm text-foreground mt-1 bg-background p-3 rounded border border-border">{example.user_input}</p>
                        </div>

                        {/* Extracted Tasks */}
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Extracted Tasks</label>
                          <div className="mt-2 space-y-2">
                            {tasks.map((task: any, idx: number) => (
                              <div key={idx} className="bg-background p-3 rounded border border-border">
                                <p className="font-medium text-sm text-foreground">{task.title}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-1 rounded">{task.category}</span>
                                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">{task.priority}</span>
                                  <span className="text-xs bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">{task.estimatedTime}</span>
                                </div>
                                {task.description && <p className="text-xs text-muted-foreground mt-2">{task.description}</p>}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Notes */}
                        {example.status === 'pending' && (
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Notes (Optional)</label>
                            <textarea
                              value={notes[example.id] || ''}
                              onChange={(e) => setNotes(prev => ({ ...prev, [example.id]: e.target.value }))}
                              placeholder="Add notes about this example..."
                              className="w-full mt-2 text-sm p-2 bg-background border border-border rounded resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                              rows={2}
                            />
                          </div>
                        )}

                        {/* Actions */}
                        {example.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => updateExampleStatus(example.id, 'rejected')}
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </Button>
                            <Button
                              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => updateExampleStatus(example.id, 'approved')}
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
          <p className="text-sm text-violet-900 dark:text-violet-200">
            <strong>How to use:</strong> Approved examples are used for fine-tuning your custom AI model. Regularly review new examples and export approved data to train your model for better task extraction accuracy.
          </p>
        </div>
      </div>
    </div>
  )
}
