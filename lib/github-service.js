/**
 * GitHub Issues API Service for AI Task Extraction
 * 
 * This service fetches and analyzes GitHub issues for AI training data.
 * It provides rich metadata extraction and categorization for task extraction models.
 * 
 * FEATURES:
 * - Fetches issues from multiple repositories
 * - Automatic categorization (bug, feature, documentation, etc.)
 * - Priority extraction from labels and content
 * - Complexity analysis (simple, medium, complex)
 * - Time estimation for task completion
 * - Rich metadata for AI training
 * 
 * CONFIGURATION:
 * - GITHUB_API_KEY: Personal access token from GitHub Settings
 * - GITHUB_REPOS: Comma-separated list of repositories
 * 
 * RATE LIMITS:
 * - GitHub API: 5000 requests/hour for authenticated requests
 * - Built-in rate limiting protection
 * 
 * USAGE:
 * const service = new GitHubIssuesService();
 * const issues = await service.fetchIssues({ limit: 100 });
 * const stats = service.getStatistics(issues);
 */

// GitHub Issues API Service for AI Task Extraction
require('dotenv').config();

class GitHubIssuesService {
  constructor() {
    this.apiKey = process.env.GITHUB_API_KEY;
    this.baseURL = 'https://api.github.com';
    this.repos = process.env.GITHUB_REPOS?.split(',') || [
      'microsoft/vscode',
      'facebook/react',
      'vercel/next.js'
    ];
    
    if (!this.apiKey) {
      throw new Error('GITHUB_API_KEY environment variable is required');
    }
  }

  async fetchIssues(options = {}) {
    const {
      state = 'all',        // open, closed, all
      labels = [],          // filter by labels
      limit = 100,          // total issues per repo
      perPage = 50,         // issues per API call
      sort = 'created',     // created, updated, comments
      direction = 'desc'    // asc, desc
    } = options;

    const allIssues = [];

    for (const repo of this.repos) {
      try {
        console.log(`📊 Fetching issues from ${repo}...`);
        const issues = await this.fetchRepoIssues(repo, {
          state,
          labels,
          limit,
          perPage,
          sort,
          direction
        });
        
        allIssues.push(...issues);
        console.log(`✅ Fetched ${issues.length} issues from ${repo}`);
        
      } catch (error) {
        console.error(`❌ Error fetching from ${repo}:`, error.message);
      }
    }

    return this.formatIssues(allIssues);
  }

  async fetchRepoIssues(repo, options) {
    const { state, labels, limit, perPage, sort, direction } = options;
    const issues = [];
    let page = 1;

    while (issues.length < limit) {
      const url = new URL(`${this.baseURL}/repos/${repo}/issues`);
      
      // Build query parameters
      url.searchParams.set('state', state);
      url.searchParams.set('sort', sort);
      url.searchParams.set('direction', direction);
      url.searchParams.set('per_page', Math.min(perPage, limit - issues.length));
      url.searchParams.set('page', page);
      
      if (labels.length > 0) {
        url.searchParams.set('labels', labels.join(','));
      }

      const response = await this.makeRequest(url.toString());
      
      if (response.length === 0) break;
      
      issues.push(...response);
      page++;
      
      // Rate limiting protection
      await this.sleep(100);
    }

    return issues.slice(0, limit);
  }

  async makeRequest(url) {
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${this.apiKey}`,
        'User-Agent': 'AI-Task-Extraction-App',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API Error (${response.status}): ${error}`);
    }

    return response.json();
  }

  formatIssues(issues) {
    return issues.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      description: issue.body || '',
      state: issue.state,
      priority: this.extractPriority(issue.labels),
      labels: issue.labels.map(label => label.name),
      assignee: issue.assignee?.login || null,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at,
      comments: issue.comments,
      repository: issue.repository_url.split('/').slice(-2).join('/'),
      url: issue.html_url,
      // Additional fields for AI training
      complexity: this.calculateComplexity(issue),
      category: this.categorizeIssue(issue),
      estimatedTime: this.estimateTime(issue)
    }));
  }

  extractPriority(labels) {
    const priorityLabels = labels.filter(label => 
      /priority|urgent|critical|high|medium|low/i.test(label.name)
    );
    
    if (priorityLabels.length === 0) return 'medium';
    
    const name = priorityLabels[0].name.toLowerCase();
    if (name.includes('critical') || name.includes('urgent')) return 'high';
    if (name.includes('high')) return 'high';
    if (name.includes('low')) return 'low';
    
    return 'medium';
  }

  calculateComplexity(issue) {
    let score = 0;
    
    // Description length
    if (issue.body) {
      score += Math.min(issue.body.length / 500, 3);
    }
    
    // Number of comments
    score += Math.min(issue.comments / 10, 2);
    
    // Number of labels
    score += Math.min(issue.labels.length / 5, 1);
    
    // Has assignee
    if (issue.assignee) score += 0.5;
    
    // Is in complex project
    const complexRepos = ['microsoft/vscode', 'facebook/react', 'kubernetes/kubernetes'];
    if (complexRepos.some(repo => issue.repository_url.includes(repo))) {
      score += 1;
    }
    
    if (score < 2) return 'simple';
    if (score < 4) return 'medium';
    return 'complex';
  }

  categorizeIssue(issue) {
    const title = issue.title.toLowerCase();
    const body = (issue.body || '').toLowerCase();
    const text = `${title} ${body}`;
    const labels = issue.labels.map(l => l.name.toLowerCase());
    
    // Bug detection
    if (/bug|fix|error|crash|issue|problem|broken|fail/i.test(text) ||
        labels.some(l => /bug|fix/i.test(l))) {
      return 'bug';
    }
    
    // Feature request
    if (/feature|request|enhancement|add|implement|new|support/i.test(text) ||
        labels.some(l => /feature|enhancement/i.test(l))) {
      return 'feature';
    }
    
    // Documentation
    if (/doc|readme|tutorial|guide|example|documentation/i.test(text) ||
        labels.some(l => /doc/i.test(l))) {
      return 'documentation';
    }
    
    // Performance
    if (/performance|slow|optimize|speed|memory|cpu/i.test(text) ||
        labels.some(l => /performance/i.test(l))) {
      return 'performance';
    }
    
    // Security
    if (/security|vulnerability|exploit|auth|permission/i.test(text) ||
        labels.some(l => /security/i.test(l))) {
      return 'security';
    }
    
    // Testing
    if (/test|spec|coverage|unit|integration/i.test(text) ||
        labels.some(l => /test/i.test(l))) {
      return 'testing';
    }
    
    return 'general';
  }

  estimateTime(issue) {
    const complexity = this.calculateComplexity(issue);
    const category = this.categorizeIssue(issue);
    
    // Base time estimates (hours)
    const baseEstimates = {
      'simple': 2,
      'medium': 8,
      'complex': 24
    };
    
    // Category multipliers
    const categoryMultipliers = {
      'bug': 1.2,
      'feature': 1.5,
      'documentation': 0.8,
      'performance': 1.8,
      'security': 2.0,
      'testing': 1.0,
      'general': 1.0
    };
    
    const baseTime = baseEstimates[complexity] || 8;
    const multiplier = categoryMultipliers[category] || 1.0;
    
    return Math.round(baseTime * multiplier);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get statistics about the fetched issues
  getStatistics(issues) {
    const stats = {
      total: issues.length,
      byState: {},
      byPriority: {},
      byCategory: {},
      byComplexity: {},
      avgComments: 0,
      repositories: [...new Set(issues.map(i => i.repository))]
    };

    issues.forEach(issue => {
      // State distribution
      stats.byState[issue.state] = (stats.byState[issue.state] || 0) + 1;
      
      // Priority distribution
      stats.byPriority[issue.priority] = (stats.byPriority[issue.priority] || 0) + 1;
      
      // Category distribution
      stats.byCategory[issue.category] = (stats.byCategory[issue.category] || 0) + 1;
      
      // Complexity distribution
      stats.byComplexity[issue.complexity] = (stats.byComplexity[issue.complexity] || 0) + 1;
    });

    stats.avgComments = Math.round(
      issues.reduce((sum, issue) => sum + issue.comments, 0) / issues.length
    );

    return stats;
  }
}

module.exports = GitHubIssuesService;
