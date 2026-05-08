// Todoist API Integration
// For connecting to real Todoist data

export interface TodoistTask {
  id: string
  content: string
  description?: string
  is_completed: boolean
  priority: number // 1-4 (4 = highest)
  due?: {
    date: string
    is_recurring: boolean
  }
  created_at: string
  completed_at?: string
  labels: string[]
  project_id: string
}

export interface TodoistProject {
  id: string
  name: string
  color: string
  parent_id?: string
}

export class TodoistAPI {
  private apiKey: string
  private baseURL = 'https://api.todoist.com/rest/v2'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/projects`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      return response.ok
    } catch {
      return false
    }
  }

  // Get all projects
  async getProjects(): Promise<TodoistProject[]> {
    const response = await fetch(`${this.baseURL}/projects`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`)
    }

    return response.json()
  }

  // Get all tasks
  async getAllTasks(): Promise<TodoistTask[]> {
    const response = await fetch(`${this.baseURL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`)
    }

    return response.json()
  }

  // Get tasks from specific project
  async getProjectTasks(projectId: string): Promise<TodoistTask[]> {
    const response = await fetch(`${this.baseURL}/tasks?project_id=${projectId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch project tasks: ${response.statusText}`)
    }

    return response.json()
  }

  // Get completed tasks (last 30 days)
  async getCompletedTasks(): Promise<TodoistTask[]> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const response = await fetch(`${this.baseURL}/completed/items?since=${thirtyDaysAgo.toISOString()}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch completed tasks: ${response.statusText}`)
    }

    return response.json()
  }

  // Get task statistics
  async getTaskStats(): Promise<{
    total: number
    completed: number
    pending: number
    overdue: number
    with_due_dates: number
    by_priority: { [key: string]: number }
  }> {
    const tasks = await this.getAllTasks()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.is_completed).length,
      pending: tasks.filter(t => !t.is_completed).length,
      overdue: 0,
      with_due_dates: tasks.filter(t => t.due).length,
      by_priority: {
        'Urgent': 0,
        'High': 0,
        'Medium': 0,
        'Low': 0
      }
    }

    // Count overdue tasks
    for (const task of tasks) {
      if (!task.is_completed && task.due) {
        const dueDate = new Date(task.due.date)
        dueDate.setHours(0, 0, 0, 0)
        if (dueDate < today) {
          stats.overdue++
        }
      }

      // Count by priority
      const priority = this.mapPriorityToString(task.priority)
      if (priority in stats.by_priority) {
        stats.by_priority[priority]++
      }
    }

    return stats
  }

  // Convert Todoist priority to string
  private mapPriorityToString(priority: number): string {
    switch (priority) {
      case 4: return 'Urgent'
      case 3: return 'High'
      case 2: return 'Medium'
      case 1: return 'Low'
      default: return 'Medium'
    }
  }

  // Export tasks for training
  async exportForTraining(): Promise<{
    tasks: Array<{
      title: string
      description?: string
      completed: boolean
      priority: string
      due_date?: string
      labels: string[]
      created_at: string
      completed_at?: string
    }>
    projects: Array<{
      id: string
      name: string
      task_count: number
    }>
  }> {
    const [tasks, projects] = await Promise.all([
      this.getAllTasks(),
      this.getProjects()
    ])

    // Count tasks per project
    const projectTaskCounts: { [key: string]: number } = {}
    tasks.forEach(task => {
      projectTaskCounts[task.project_id] = (projectTaskCounts[task.project_id] || 0) + 1
    })

    return {
      tasks: tasks.map(task => ({
        title: task.content,
        description: task.description,
        completed: task.is_completed,
        priority: this.mapPriorityToString(task.priority),
        due_date: task.due?.date,
        labels: task.labels,
        created_at: task.created_at,
        completed_at: task.completed_at
      })),
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        task_count: projectTaskCounts[project.id] || 0
      }))
    }
  }
}

// Instructions for getting Todoist API key:
export const TODOIST_SETUP_INSTRUCTIONS = `
## Todoist API Setup Instructions

### 1. Get API Key
1. Go to https://todoist.com/app/settings/integrations
2. Find "API token" section
3. Copy your API token

### 2. Add to Environment Variables
Add this to your .env file:
\`\`\`
TODOIST_API_KEY=your_api_token_here
\`\`\`

### 3. Test Connection
Use the testConnection() method to verify your API key works

### 4. Rate Limits
- Free tier: 100 requests per minute
- Pro tier: 500 requests per minute
- Business tier: 1000 requests per minute

### 5. Permissions
The API token has access to:
- Read all tasks and projects
- Create, update, and delete tasks
- Read activity logs

### Security Notes:
- Never expose your API key in client-side code
- Use environment variables
- Rotate API keys periodically
- Monitor API usage
`
