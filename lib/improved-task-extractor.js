/**
 * Improved AI Task Extractor
 * Combines GitHub-trained models with custom examples for better natural language understanding
 */

const fs = require('fs');

class ImprovedTaskExtractor {
  constructor() {
    this.customExamples = [];
    this.loadCustomExamples();
  }

  loadCustomExamples() {
    try {
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
  async extractTasks(input) {
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
  extractSingleTaskWithSchedule(input) {
    const patterns = [
      // Create/Add todo/task patterns - YOUR SPECIFIC CASE
      /^(create|add|make|new)\s+(todo|task|list)?\s*([^]+?)\s+(schedule|due|on|by|for)\s+(.+)$/i,
      // Direct scheduling patterns
      /^(.+?)\s+(schedule|due|on|by|for)\s+(.+)$/i,
      // Simple task + date patterns
      /^(.+?)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4}|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|next\s+week|this\s+week|end\s+of\s+day|by\s+(friday|monday))$/i
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
  extractMultipleTasks(input) {
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
        const tasks = [];
        
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
  extractWithPatterns(input) {
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
  cleanTaskDescription(task) {
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
  determineTaskType(task) {
    const typeKeywords = {
      'meeting': ['meeting', 'call', 'appointment', 'interview', 'discussion'],
      'shopping': ['buy', 'get', 'purchase', 'shop', 'grocery', 'store'],
      'cooking': ['cook', 'bake', 'prepare', 'dinner', 'lunch', 'breakfast', 'meal'],
      'study': ['study', 'learn', 'read', 'research', 'practice', 'review', 'exam', 'test', 'presentation'],
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
  extractPriority(task) {
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
}

// Export singleton instance
const taskExtractor = new ImprovedTaskExtractor();

// Example usage
async function extractTasksFromText(text) {
  return await taskExtractor.extractTasks(text);
}

module.exports = { ImprovedTaskExtractor, taskExtractor, extractTasksFromText };
