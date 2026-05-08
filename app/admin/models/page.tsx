'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Plus, Trash2, Play, Loader2, AlertCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ModelVersion {
  id: string
  name: string
  description: string
  training_dataset_id?: string
  metrics?: {
    accuracy?: number
    precision?: number
    recall?: number
    f1_score?: number
  }
  status: 'training' | 'ready' | 'active' | 'deprecated'
  created_at: string
  is_active: boolean
}

interface ABTestResult {
  id: string
  model_a_id: string
  model_b_id: string
  test_input: string
  model_a_output: string
  model_b_output: string
  winner?: 'a' | 'b' | 'tie'
  votes_a: number
  votes_b: number
  created_at: string
}

export default function ModelsPage() {
  const [models, setModels] = useState<ModelVersion[]>([])
  const [abTests, setAbTests] = useState<ABTestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewModelForm, setShowNewModelForm] = useState(false)
  const [newModel, setNewModel] = useState({ name: '', description: '' })
  const [activeModel, setActiveModel] = useState<string | null>(null)

  useEffect(() => {
    loadModels()
    loadABTests()
  }, [])

  const loadModels = async () => {
    try {
      const response = await fetch('/api/admin/models')
      if (!response.ok) throw new Error('Failed to load models')
      const data = await response.json()
      setModels(data.models || [])
      setActiveModel(data.activeModel)
    } catch (error) {
      console.error('[v0] Failed to load models:', error)
    }
  }

  const loadABTests = async () => {
    try {
      const response = await fetch('/api/admin/models/ab-test')
      if (!response.ok) throw new Error('Failed to load A/B tests')
      const data = await response.json()
      setAbTests(data.tests || [])
    } catch (error) {
      console.error('[v0] Failed to load A/B tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateModel = async () => {
    if (!newModel.name) return

    try {
      const response = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModel),
      })

      if (!response.ok) throw new Error('Failed to create model')
      
      setNewModel({ name: '', description: '' })
      setShowNewModelForm(false)
      await loadModels()
    } catch (error) {
      console.error('[v0] Failed to create model:', error)
    }
  }

  const setActive = async (modelId: string) => {
    try {
      const response = await fetch('/api/admin/models/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      })

      if (!response.ok) throw new Error('Failed to activate model')
      await loadModels()
    } catch (error) {
      console.error('[v0] Failed to activate model:', error)
    }
  }

  const deleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return

    try {
      const response = await fetch('/api/admin/models', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      })

      if (!response.ok) throw new Error('Failed to delete model')
      await loadModels()
    } catch (error) {
      console.error('[v0] Failed to delete model:', error)
    }
  }

  const chartData = models.map(model => ({
    name: model.name,
    accuracy: model.metrics?.accuracy || 0,
    f1: model.metrics?.f1_score || 0,
  }))

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Model Management</h1>
          <p className="text-muted-foreground">Manage model versions, track metrics, and run A/B tests</p>
        </div>

        {/* Create Model Section */}
        {!showNewModelForm ? (
          <Button
            onClick={() => setShowNewModelForm(true)}
            className="mb-6 gap-2 bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Create New Model Version
          </Button>
        ) : (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-foreground mb-4">Create New Model Version</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Model Name</label>
                <input
                  type="text"
                  value={newModel.name}
                  onChange={(e) => setNewModel(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Task-Extractor-v2-Fine-tuned"
                  className="w-full mt-2 px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={newModel.description}
                  onChange={(e) => setNewModel(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Training date, dataset size, improvements..."
                  className="w-full mt-2 px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateModel}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Create
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewModelForm(false)
                    setNewModel({ name: '', description: '' })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Models Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {models.map(model => (
            <div
              key={model.id}
              className={cn(
                'bg-card border rounded-lg p-6 transition-all',
                model.is_active
                  ? 'border-violet-500 shadow-lg shadow-violet-500/20'
                  : 'border-border'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{model.name}</h3>
                    {model.is_active && (
                      <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-1 rounded">
                        Active
                      </span>
                    )}
                    <span className={cn(
                      'text-xs px-2 py-1 rounded',
                      model.status === 'training' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                      model.status === 'ready' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                    )}>
                      {model.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{model.description}</p>
                </div>
                <button
                  onClick={() => deleteModel(model.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Metrics */}
              {model.metrics && (
                <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-muted/50 rounded">
                  {Object.entries(model.metrics).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-medium text-foreground">{(value * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {!model.is_active && model.status === 'ready' && (
                <Button
                  onClick={() => setActive(model.id)}
                  className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <Play className="w-4 h-4" />
                  Activate Model
                </Button>
              )}

              <p className="text-xs text-muted-foreground mt-3">
                Created: {new Date(model.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        {/* Performance Chart */}
        {chartData.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Model Performance
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)' }} />
                <Legend />
                <Bar dataKey="accuracy" fill="#8b5cf6" name="Accuracy" />
                <Bar dataKey="f1" fill="#3b82f6" name="F1 Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* A/B Testing Results */}
        {abTests.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">A/B Testing Results</h2>
            <div className="space-y-3">
              {abTests.slice(0, 10).map(test => (
                <div key={test.id} className="p-3 bg-muted/50 rounded border border-border">
                  <p className="text-sm text-foreground mb-2 line-clamp-2">{test.test_input}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Model A: {test.votes_a} votes | Model B: {test.votes_b} votes
                    </span>
                    {test.winner && (
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                        Model {test.winner.toUpperCase()} wins
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {models.length === 0 && (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No models created yet. Start by training your first fine-tuned model.</p>
          </div>
        )}
      </div>
    </div>
  )
}
