"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Settings, Database, RefreshCw } from "lucide-react"
import { datasetManager, type DatasetConfig } from "@/lib/ai/dataset-manager"
import { TodoistAPI, TODOIST_SETUP_INSTRUCTIONS } from "@/lib/ai/todoist-api"

export function DatasetIntegration() {
  const [configs, setConfigs] = useState<DatasetConfig[]>([])
  const [stats, setStats] = useState<{ [source: string]: any }>({})
  const [loading, setLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [apiKeys, setApiKeys] = useState<{ [source: string]: string }>({})

  useEffect(() => {
    loadConfigs()
    loadStats()
  }, [])

  const loadConfigs = () => {
    const datasetConfigs = datasetManager.getConfigs()
    setConfigs(datasetConfigs)
  }

  const loadStats = async () => {
    try {
      const datasetStats = await datasetManager.getDatasetStats()
      setStats(datasetStats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const toggleDataset = async (source: string, enabled: boolean) => {
    setLoading(true)
    try {
      datasetManager.updateConfig(source, { enabled })
      
      if (enabled && apiKeys[source]) {
        datasetManager.updateConfig(source, { api_key: apiKeys[source] })
      }
      
      await loadConfigs()
      await loadStats()
    } catch (error) {
      console.error('Failed to toggle dataset:', error)
    } finally {
      setLoading(false)
    }
  }

  const testTodoistConnection = async () => {
    setTestingConnection('todoist')
    try {
      const apiKey = apiKeys['todoist']
      if (!apiKey) {
        alert('Please enter Todoist API key first')
        return
      }

      const todoistAPI = new TodoistAPI(apiKey)
      const isConnected = await todoistAPI.testConnection()
      
      if (isConnected) {
        alert('✅ Todoist connection successful!')
        // Save the API key
        datasetManager.updateConfig('todoist', { 
          enabled: true, 
          api_key: apiKey,
          last_sync: new Date()
        })
        await loadConfigs()
        await loadStats()
      } else {
        alert('❌ Todoist connection failed. Please check your API key.')
      }
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTestingConnection(null)
    }
  }

  const syncDataset = async (source: string) => {
    setLoading(true)
    try {
      // Clear cache to force fresh data
      datasetManager.clearCache()
      
      // Update last sync time
      datasetManager.updateConfig(source, { last_sync: new Date() })
      
      await loadStats()
      alert(`✅ ${source} dataset synced successfully!`)
    } catch (error) {
      alert(`❌ Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const trainWithRealData = async () => {
    setLoading(true)
    try {
      const trainingData = await datasetManager.trainWithRealData()
      alert(`✅ Training completed with ${trainingData.length} examples!`)
    } catch (error) {
      alert(`❌ Training failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dataset Integration</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Connect real data sources to improve AI accuracy
          </p>
        </div>
        <Button onClick={trainWithRealData} disabled={loading}>
          <Database className="w-4 h-4 mr-2" />
          Train with Real Data
        </Button>
      </div>

      {/* Todoist Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            Todoist Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="todoist-enabled">Enable Todoist</Label>
              <p className="text-sm text-gray-600">
                Import your real tasks from Todoist
              </p>
            </div>
            <Switch
              id="todoist-enabled"
              checked={configs.find(c => c.source === 'todoist')?.enabled || false}
              onCheckedChange={(enabled) => toggleDataset('todoist', enabled)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="todoist-api-key">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="todoist-api-key"
                type="password"
                placeholder="Enter Todoist API key"
                value={apiKeys['todoist'] || ''}
                onChange={(e) => setApiKeys(prev => ({ ...prev, todoist: e.target.value }))}
              />
              <Button 
                variant="outline" 
                onClick={testTodoistConnection}
                disabled={testingConnection === 'todoist'}
              >
                {testingConnection === 'todoist' ? (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Test'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowInstructions(!showInstructions)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {showInstructions && (
            <Card className="bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Setup Instructions:</h4>
                <pre className="text-xs whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {TODOIST_SETUP_INSTRUCTIONS}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Todoist Stats */}
          {stats.todoist && stats.todoist.total_tasks > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.todoist.total_tasks}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.todoist.completed_tasks}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.todoist.with_due_dates}</div>
                <div className="text-sm text-gray-600">With Due Dates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.todoist.overdue || 0}</div>
                <div className="text-sm text-gray-600">Overdue</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Datasets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Other Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {configs
            .filter(config => config.source !== 'todoist')
            .map(config => (
              <div key={config.source} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{config.name}</h3>
                  <p className="text-sm text-gray-600">
                    {config.source === 'github' && 'Import issues from your GitHub repositories'}
                    {config.source === 'jira' && 'Connect to your JIRA workspace'}
                  </p>
                  {stats[config.source] && (
                    <div className="flex gap-2 mt-2">
                      {stats[config.source].total_tasks && (
                        <Badge variant="secondary">
                          {stats[config.source].total_tasks} tasks
                        </Badge>
                      )}
                      {stats[config.source].error && (
                        <Badge variant="destructive">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {stats[config.source].error}
                        </Badge>
                      )}
                      {!stats[config.source].enabled && (
                        <Badge variant="outline">
                          Not configured
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(enabled) => toggleDataset(config.source, enabled)}
                  />
                  {config.enabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncDataset(config.source)}
                      disabled={loading}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Training Status */}
      <Card>
        <CardHeader>
          <CardTitle>Training Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Basic patterns: Active (minimal rule-based)</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              <span>Real datasets: {configs.filter(c => c.enabled).length} connected</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <span>Model training: Ready for real dataset integration</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
