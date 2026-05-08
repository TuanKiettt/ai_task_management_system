/**
 * Simple Task Extractor - No complex dependencies
 * Focus on fixing the specific issue: "Create todo [task] schedule on [date]"
 */

function extractTasksFromText(text) {
  const input = text.toLowerCase().trim();
  
  // Pattern 1: "Create todo [task] schedule on [date]" - YOUR SPECIFIC CASE
  const createTodoPattern = /^(create|add|make|new)\s+(todo|task|list)?\s*(.+?)\s+(schedule|due|on|by|for)\s+(.+)$/i;
  const match = input.match(createTodoPattern);
  
  if (match) {
    const task = match[3].trim();
    const date = match[5].trim();
    
    return {
      tasks: [{
        task: task,
        due_date: date,
        type: getTaskType(task),
        priority: 'medium'
      }],
      confidence: 0.9,
      reasoning: 'Extracted single task with schedule using create todo pattern'
    };
  }
  
  // Pattern 2: Multiple tasks with "and"
  if (input.includes(' and ')) {
    const parts = input.split(/\s+and\s+/);
    if (parts.length > 1) {
      const tasks = parts.map(part => ({
        task: part.trim(),
        type: getTaskType(part),
        priority: 'medium'
      }));
      
      return {
        tasks: tasks,
        confidence: 0.8,
        reasoning: `Extracted ${tasks.length} tasks using compound sentence parsing`
      };
    }
  }
  
  // Pattern 3: Simple task + date
  const simplePattern = /^(.+?)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4}|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|next\s+week|this\s+week)$/i;
  const simpleMatch = input.match(simplePattern);
  
  if (simpleMatch) {
    const task = simpleMatch[1].trim();
    const date = simpleMatch[2].trim();
    
    return {
      tasks: [{
        task: task,
        due_date: date,
        type: getTaskType(task),
        priority: 'medium'
      }],
      confidence: 0.7,
      reasoning: 'Extracted single task with date using simple pattern'
    };
  }
  
  // Fallback: No pattern matched
  return {
    tasks: [],
    confidence: 0,
    reasoning: 'No task pattern matched'
  };
}

function getTaskType(task) {
  const lower = task.toLowerCase();
  
  if (lower.includes('presentation') || lower.includes('study') || lower.includes('learn')) {
    return 'study';
  }
  if (lower.includes('meeting') || lower.includes('call') || lower.includes('appointment')) {
    return 'meeting';
  }
  if (lower.includes('buy') || lower.includes('shop') || lower.includes('grocery')) {
    return 'shopping';
  }
  if (lower.includes('cook') || lower.includes('dinner') || lower.includes('lunch')) {
    return 'cooking';
  }
  if (lower.includes('fix') || lower.includes('bug') || lower.includes('error')) {
    return 'bug_fix';
  }
  
  return 'todo'; // Default
}

module.exports = { extractTasksFromText };
