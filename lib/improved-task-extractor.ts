/**
 * Improved AI Task Extractor
 * Combines GitHub-trained models with custom examples for better natural language understanding
 */

interface ExtractedTask {
  task: string;
  due_date?: string;
  type: string;
  priority: string;
}

interface TaskExtractionResult {
  tasks: ExtractedTask[];
  confidence: number;
  reasoning: string;
}

export class ImprovedTaskExtractor {
  private customExamples: any[] = [];
  
  constructor() {
    this.loadCustomExamples();
  }

  private loadCustomExamples() {
    try {
      const fs = require('fs');
      const customData = JSON.parse(fs.readFileSync('custom-task-examples.json', 'utf8'));
      this.customExamples = customData.custom_training_data || [];
    } catch (error) {
      console.warn('Custom examples not loaded, using default patterns');
      this.customExamples = [];
    }
  }

  /**
   * Extract tasks from natural language input
   */
  async extractTasks(input: string): Promise<TaskExtractionResult> {
    const normalizedInput = input.toLowerCase().trim();
    
    // Step 1: Check if it's a single task with scheduling
    const singleTaskResult = this.extractSingleTaskWithSchedule(normalizedInput);
    if (singleTaskResult.tasks.length > 0) {
      return singleTaskResult;
    }

    // Step 2: Check if it's multiple tasks
    const multiTaskResult = this.extractMultipleTasks(normalizedInput);
    if (multiTaskResult.tasks.length > 0) {
      return multiTaskResult;
    }

    // Step 3: Fallback to pattern matching
    return this.extractWithPatterns(normalizedInput);
  }

  /**
   * Extract single task with scheduling information
   * Handles: "Create todo [task] schedule on [date]"
   */
  private extractSingleTaskWithSchedule(input: string): TaskExtractionResult {
    const patterns = [
      // Create/Add todo/task patterns
      /^(create|add|make|new)\s+(todo|task|list)?\s*([^]+?)\s+(schedule|due|on|by|for)\s+(.+)$/i,
      // Direct scheduling patterns
      /^(.+?)\s+(schedule|due|on|by|for)\s+(.+)$/i,
      // Simple task + date patterns
      /^(.+?)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4}|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|next\s+week|this\s+week|end\s+of\s+day|by\s+(friday|monday|etc))$/i
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        let task = match[match.length - 2]?.trim();
        let dateInfo = match[match.length - 1]?.trim();

        // Clean up task description
        task = this.cleanTaskDescription(task);
        
        // Extract priority from task
        const priority = this.extractPriority(task);
        
        return {
          tasks: [{
            task: task,
            due_date: dateInfo,
            type: this.determineTaskType(task),
            priority: priority
          }],
          confidence: 0.9,
          reasoning: `Extracted single task with schedule using pattern matching`
        };
      }
    }

    return { tasks: [], confidence: 0, reasoning: 'No single task pattern matched' };
  }

  /**
   * Extract multiple tasks from compound sentences
   * Handles: "Do A and B and C"
   */
  private extractMultipleTasks(input: string): TaskExtractionResult {
    const separators = [
      /\s+and\s+/,
      /\s+,?\s*then\s+/,
      /\s+,?\s*after\s+/,
      /\s+,?\s*before\s+/,
      /\s+;\s+/,
      /\s+,?\s*/  // comma separation
    ];

    for (const separator of separators) {
      const parts = input.split(separator);
      if (parts.length > 1) {
        const tasks: ExtractedTask[] = [];
        
        parts.forEach((part, index) => {
          const cleanedPart = this.cleanTaskDescription(part.trim());
          if (cleanedPart.length > 3) { // Minimum meaningful length
            tasks.push({
              task: cleanedPart,
              type: this.determineTaskType(cleanedPart),
              priority: this.extractPriority(cleanedPart)
            });
          }
        });

        if (tasks.length > 1) {
          return {
            tasks: tasks,
            confidence: 0.8,
            reasoning: `Extracted ${tasks.length} tasks using compound sentence parsing`
          };
        }
      }
    }

    return { tasks: [], confidence: 0, reasoning: 'No multiple task pattern matched' };
  }

  /**
   * Fallback pattern-based extraction
   */
  private extractWithPatterns(input: string): TaskExtractionResult {
    const taskPatterns = [
      // Action + object patterns
      /^(create|make|build|write|code|design|develop|fix|update|modify|buy|get|call|email|schedule|book|reserve|study|learn|practice|finish|complete|start|begin)\s+(.+)$/i,
      // Direct task patterns
      /^(.+?)\s+(for|to|by|on|at|in|with)\s+(.+)$/i,
      // Simple noun phrases that look like tasks
      /^(meeting|call|appointment|presentation|report|project|assignment|homework|shopping|groceries|dinner|lunch|breakfast|exercise|workout|walk|run|drive|flight|trip|vacation|doctor|dentist|haircut|interview|review|study|class|course|exam|test)(.+)?$/i
    ];

    for (const pattern of taskPatterns) {
      const match = input.match(pattern);
      if (match) {
        const task = this.cleanTaskDescription(match[0]);
        return {
          tasks: [{
            task: task,
            type: this.determineTaskType(task),
            priority: this.extractPriority(task)
          }],
          confidence: 0.6,
          reasoning: `Extracted task using fallback pattern matching`
        };
      }
    }

    return { tasks: [], confidence: 0, reasoning: 'No task patterns matched' };
  }

  /**
   * Clean and normalize task description
   */
  private cleanTaskDescription(task: string): string {
    return task
      .replace(/^(create|add|make|new|todo|task|list)\s+/i, '') // Remove action prefixes
      .replace(/\s+(schedule|due|on|by|for|at|in)\s+.*$/i, '') // Remove scheduling suffixes
      .replace(/\b(a|an|the|my|our|your|their)\s+/gi, '') // Remove articles
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * Determine task type based on keywords
   */
  private determineTaskType(task: string): string {
    const typeKeywords = {
      'meeting': ['meeting', 'call', 'appointment', 'interview', 'discussion'],
      'shopping': ['buy', 'get', 'purchase', 'shop', 'grocery', 'store'],
      'cooking': ['cook', 'bake', 'prepare', 'dinner', 'lunch', 'breakfast', 'meal'],
      'study': ['study', 'learn', 'read', 'research', 'practice', 'review', 'exam', 'test'],
      'work': ['work', 'project', 'assignment', 'report', 'presentation', 'documentation'],
      'personal': ['call', 'email', 'doctor', 'dentist', 'haircut', 'exercise', 'workout'],
      'todo': ['todo', 'task', 'fix', 'update', 'modify', 'create', 'build']
    };

    const lowerTask = task.toLowerCase();
    
    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some(keyword => lowerTask.includes(keyword))) {
        return type;
      }
    }

    return 'todo'; // Default type
  }

  /**
   * Extract priority from task description
   */
  private extractPriority(task: string): string {
    const priorityKeywords = {
      'high': ['urgent', 'asap', 'important', 'critical', 'emergency', 'immediately'],
      'medium': ['soon', 'this week', 'by friday', 'priority'],
      'low': ['sometime', 'eventually', 'later', 'when possible', 'can wait']
    };

    const lowerTask = task.toLowerCase();
    
    for (const [priority, keywords] of Object.entries(priorityKeywords)) {
      if (keywords.some(keyword => lowerTask.includes(keyword))) {
        return priority;
      }
    }

    return 'medium'; // Default priority
  }

  /**
   * Find similar custom examples for context
   */
  private findSimilarExamples(input: string): any[] {
    const inputWords = input.toLowerCase().split(/\s+/);
    const similarities: { example: any; score: number }[] = [];

    this.customExamples.forEach(example => {
      const exampleText = (example.input.title + ' ' + example.input.description).toLowerCase();
      const exampleWords = exampleText.split(/\s+/);
      
      // Simple word overlap similarity
      const commonWords = inputWords.filter(word => exampleWords.includes(word));
      const similarity = commonWords.length / Math.max(inputWords.length, exampleWords.length);
      
      if (similarity > 0.2) {
        similarities.push({ example, score: similarity });
      }
    });

    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.example);
  }
}

// Export singleton instance
export const taskExtractor = new ImprovedTaskExtractor();

// Example usage
export async function extractTasksFromText(text: string): Promise<TaskExtractionResult> {
  return await taskExtractor.extractTasks(text);
}
