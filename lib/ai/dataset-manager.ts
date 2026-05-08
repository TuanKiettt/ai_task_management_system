// Real Dataset Integration Infrastructure
// For connecting to actual data sources and training models

export interface RealTaskData {
  id: string
  title: string
  description?: string
  completed: boolean
  priority?: string
  due_date?: string
  created_at: string
  completed_at?: string
  labels?: string[]
  project_id?: string
  source: 'todoist' | 'github' | 'jira' | 'asana' | 'user_data'
  raw_data?: any
}

export interface DatasetConfig {
  name: string
  source: string
  api_endpoint?: string
  api_key?: string
  enabled: boolean
  last_sync?: Date
  total_tasks?: number
}

export interface TrainingData {
  input_text: string
  extracted_tasks: {
    title: string
    category: string
    priority: string
    estimated_time: string
    confidence: number
  }[]
  source: string
  timestamp: Date
}

// Dataset Manager for handling real data sources
export class DatasetManager {
  private configs: Map<string, DatasetConfig> = new Map()
  private cache: Map<string, RealTaskData[]> = new Map()

  constructor() {
    this.initializeConfigs()
  }

  private initializeConfigs() {
    // Todoist Configuration
    this.configs.set('todoist', {
      name: 'Todoist',
      source: 'todoist',
      api_endpoint: 'https://api.todoist.com/rest/v2',
      enabled: false,
      total_tasks: 0
    })

    // GitHub Configuration
    this.configs.set('github', {
      name: 'GitHub Issues',
      source: 'github',
      api_endpoint: 'https://api.github.com',
      enabled: false,
      total_tasks: 0
    })

    // JIRA Configuration
    this.configs.set('jira', {
      name: 'JIRA',
      source: 'jira',
      api_endpoint: '', // User needs to configure
      enabled: false,
      total_tasks: 0
    })
  }

  // Get all available dataset configurations
  getConfigs(): DatasetConfig[] {
    return Array.from(this.configs.values())
  }

  // Update dataset configuration
  updateConfig(source: string, updates: Partial<DatasetConfig>) {
    const config = this.configs.get(source)
    if (config) {
      Object.assign(config, updates)
      this.configs.set(source, config)
    }
  }

  // Get dataset statistics
  async getDatasetStats(): Promise<{ [source: string]: any }> {
    const stats: { [source: string]: any } = {}
    
    for (const [source, config] of this.configs) {
      if (config.enabled) {
        try {
          const data = await this.fetchDataset(source)
          stats[source] = {
            total_tasks: data.length,
            completed_tasks: data.filter(t => t.completed).length,
            with_due_dates: data.filter(t => t.due_date).length,
            with_priority: data.filter(t => t.priority).length,
            last_sync: config.last_sync
          }
        } catch (error) {
          stats[source] = { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      } else {
        stats[source] = { enabled: false }
      }
    }
    
    return stats
  }

  // Fetch dataset from source
  private async fetchDataset(source: string): Promise<RealTaskData[]> {
    const config = this.configs.get(source)
    if (!config || !config.enabled) {
      throw new Error(`Dataset ${source} not enabled`)
    }

    // Check cache first
    if (this.cache.has(source)) {
      return this.cache.get(source)!
    }

    let data: RealTaskData[] = []

    switch (source) {
      case 'todoist':
        data = await this.fetchTodoistData(config)
        break
      case 'github':
        data = await this.fetchGitHubData(config)
        break
      case 'jira':
        data = await this.fetchJiraData(config)
        break
      default:
        throw new Error(`Unknown source: ${source}`)
    }

    // Cache the data
    this.cache.set(source, data)
    return data
  }

  // Fetch Todoist data
  private async fetchTodoistData(config: DatasetConfig): Promise<RealTaskData[]> {
    if (!config.api_key) {
      throw new Error('Todoist API key not configured')
    }

    const response = await fetch(`${config.api_endpoint}/tasks`, {
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Todoist API error: ${response.statusText}`)
    }

    const tasks = await response.json()
    
    return tasks.map((task: any) => ({
      id: task.id,
      title: task.content,
      description: task.description,
      completed: task.is_completed,
      priority: this.mapTodoistPriority(task.priority),
      due_date: task.due?.date,
      created_at: task.created_at,
      completed_at: task.completed_at,
      labels: task.labels,
      project_id: task.project_id,
      source: 'todoist' as const,
      raw_data: task
    }))
  }

  // Fetch GitHub Issues data
  private async fetchGitHubData(config: DatasetConfig): Promise<RealTaskData[]> {
    if (!config.api_key) {
      throw new Error('GitHub API key not configured')
    }

    // Get issues from repositories (user should configure which repos)
    const repos = process.env.GITHUB_REPOS?.split(',') || []
    const allIssues: any[] = []

    for (const repo of repos) {
      const response = await fetch(`${config.api_endpoint}/repos/${repo}/issues`, {
        headers: {
          'Authorization': `token ${config.api_key}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (response.ok) {
        const issues = await response.json()
        allIssues.push(...issues)
      }
    }

    return allIssues.map((issue: any) => ({
      id: issue.id.toString(),
      title: issue.title,
      description: issue.body,
      completed: issue.state === 'closed',
      priority: this.mapGitHubPriority(issue.labels),
      due_date: undefined, // GitHub issues don't have due dates by default
      created_at: issue.created_at,
      completed_at: issue.closed_at,
      labels: issue.labels?.map((label: any) => label.name),
      source: 'github' as const,
      raw_data: issue
    }))
  }

  // Fetch JIRA data
  private async fetchJiraData(config: DatasetConfig): Promise<RealTaskData[]> {
    if (!config.api_endpoint || !config.api_key) {
      throw new Error('JIRA configuration incomplete')
    }

    // This is a simplified implementation
    // Real JIRA API integration would require OAuth or Basic Auth
    throw new Error('JIRA integration requires additional setup')
  }

  // Map Todoist priority to standard format
  private mapTodoistPriority(priority: number): string {
    switch (priority) {
      case 4: return 'Urgent'
      case 3: return 'High'
      case 2: return 'Medium'
      case 1: return 'Low'
      default: return 'Medium'
    }
  }

  // Map GitHub labels to priority
  private mapGitHubPriority(labels: any[]): string {
    if (!labels) return 'Medium'
    
    const labelNames = labels.map((label: any) => label.name.toLowerCase())
    
    if (labelNames.some(name => name.includes('urgent') || name.includes('critical'))) {
      return 'Urgent'
    }
    if (labelNames.some(name => name.includes('high') || name.includes('important'))) {
      return 'High'
    }
    if (labelNames.some(name => name.includes('low'))) {
      return 'Low'
    }
    
    return 'Medium'
  }

  // Train models with real data
  async trainWithRealData(): Promise<TrainingData[]> {
    const trainingData: TrainingData[] = []

    for (const [source, config] of this.configs) {
      if (config.enabled) {
        try {
          const data = await this.fetchDataset(source)
          
          // Convert real data to training examples
          const examples = this.convertToTrainingExamples(data, source)
          trainingData.push(...examples)
        } catch (error) {
          console.error(`Error training with ${source}:`, error)
        }
      }
    }

    return trainingData
  }

  // Convert real task data to training examples
  private convertToTrainingExamples(data: RealTaskData[], source: string): TrainingData[] {
    return data.map(task => ({
      input_text: `${task.title}${task.description ? ' ' + task.description : ''}`,
      extracted_tasks: [{
        title: task.title,
        category: this.inferCategory(task),
        priority: task.priority || 'Medium',
        estimated_time: this.estimateTime(task.title),
        confidence: 0.9 // Real data has high confidence
      }],
      source,
      timestamp: new Date()
    }))
  }

  // Infer category from task data
  private inferCategory(task: RealTaskData): string {
    const title = task.title.toLowerCase()
    
    if (task.labels) {
      const labels = task.labels.map(l => l.toLowerCase())
      if (labels.some(l => l.includes('bug') || l.includes('fix'))) return 'Bug Fix'
      if (labels.some(l => l.includes('feature'))) return 'Feature'
      if (labels.some(l => l.includes('enhancement'))) return 'Enhancement'
    }
    
    if (title.includes('meeting') || title.includes('call')) return 'Communication'
    if (title.includes('develop') || title.includes('code')) return 'Development'
    if (title.includes('design')) return 'Design'
    if (title.includes('test')) return 'Testing'
    if (title.includes('review')) return 'Review'
    
    return 'General'
  }

  // Estimate time based on task characteristics
  private estimateTime(title: string): string {
    const lowerTitle = title.toLowerCase()
    
    if (lowerTitle.includes('meeting') || lowerTitle.includes('call')) return '30m'
    if (lowerTitle.includes('review')) return '15m'
    if (lowerTitle.includes('develop') || lowerTitle.includes('implement')) return '2h'
    if (lowerTitle.includes('test')) return '1h'
    if (lowerTitle.includes('design')) return '1h'
    if (lowerTitle.includes('bug') || lowerTitle.includes('fix')) return '1h'
    
    return '30m'
  }

  // Clear cache
  clearCache() {
    this.cache.clear()
  }
}

// Export singleton instance
export const datasetManager = new DatasetManager()
