/**
 * MultiWOZ Integration for Task Management
 * Server-side AI model integration
 */

// Task categories and priorities
export const TASK_CATEGORIES = [
  'schedule_meeting',
  'schedule_deadline', 
  'schedule_appointment',
  'book_resource',
  'plan_activity',
  'arrange_transport',
  'handle_emergency',
  'create_task'
] as const;

export const TASK_PRIORITIES = [
  'urgent',
  'high', 
  'medium',
  'low'
] as const;

export interface TaskPrediction {
  category: string;
  priority: string;
  confidence: number;
  deadline?: string;
  participants?: string[];
  location?: string;
}

export interface MultiWOZResult {
  success: boolean;
  prediction?: TaskPrediction;
  error?: string;
  fallback?: boolean;
}

class MultiWOZIntegration {
  private modelsLoaded = false;

  constructor() {
    // Initialize with default values, check models asynchronously
    this.modelsLoaded = true; // Assume loaded for now
    this.checkModelsExist().catch(error => {
      console.log('Could not check model status, using defaults');
    });
  }

  /**
   * Check if trained models exist
   */
  private async checkModelsExist(): Promise<void> {
    try {
      const response = await fetch('http://localhost:3000/api/ai/status');
      const data = await response.json();
      
      if (data.success) {
        this.modelsLoaded = data.status.loaded;
        console.log('MultiWOZ models status:', this.modelsLoaded ? 'Loaded' : 'Not loaded');
      } else {
        console.log('MultiWOZ models not found, will use fallback');
        this.modelsLoaded = false;
      }
    } catch (error) {
      console.error('Error checking models:', error);
      this.modelsLoaded = false;
    }
  }

  /**
   * Parse user input using MultiWOZ models
   */
  async parseTaskInput(userInput: string): Promise<MultiWOZResult> {
    try {
      console.log(`🤖 Parsing task: "${userInput}"`);

      // Use server-side AI prediction
      const response = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput })
      });

      const data = await response.json();

      if (data.success) {
        console.log(`AI parsed: ${data.prediction.category} (${data.prediction.priority})`);
        return {
          success: true,
          prediction: data.prediction,
          fallback: data.usedFallback || false
        };
      } else {
        console.log('AI prediction failed, using fallback');
        return this.ruleBasedFallback(userInput);
      }

    } catch (error) {
      console.error('Error in MultiWOZ parsing:', error);
      return this.ruleBasedFallback(userInput);
    }
  }

  /**
   * Rule-based fallback when models are not available
   */
  private ruleBasedFallback(userInput: string): MultiWOZResult {
    const text = userInput.toLowerCase();
    
    // Extract task information
    const prediction = this.extractTaskInfoRuleBased(text);
    
    return {
      success: true,
      prediction,
      fallback: true
    };
  }

  /**
   * Extract task information using rules
   */
  private extractTaskInfoRuleBased(text: string): TaskPrediction {
    // Determine category
    let category = 'create_task';
    let priority = 'medium';
    
    // Category detection
    if (text.includes('meeting') || text.includes('call')) {
      category = 'schedule_meeting';
    } else if (text.includes('deadline') || text.includes('due')) {
      category = 'schedule_deadline';
    } else if (text.includes('appointment') || text.includes('doctor')) {
      category = 'schedule_appointment';
    } else if (text.includes('room') || text.includes('resource')) {
      category = 'book_resource';
    } else if (text.includes('activity') || text.includes('event')) {
      category = 'plan_activity';
    } else if (text.includes('taxi') || text.includes('transport') || text.includes('ride')) {
      category = 'arrange_transport';
    } else if (text.includes('urgent') || text.includes('emergency') || text.includes('asap')) {
      category = 'handle_emergency';
      priority = 'urgent';
    }

    // Priority detection
    if (text.includes('urgent') || text.includes('asap') || text.includes('immediately')) {
      priority = 'urgent';
    } else if (text.includes('important') || text.includes('high priority')) {
      priority = 'high';
    } else if (text.includes('low priority') || text.includes('when possible')) {
      priority = 'low';
    }

    // Extract structured information
    const deadline = this.extractDeadline(text);
    const participants = this.extractParticipants(text);
    const location = this.extractLocation(text);

    return {
      category,
      priority,
      confidence: 0.7, // Lower confidence for rule-based
      deadline,
      participants,
      location
    };
  }

  /**
   * Extract deadline from text
   */
  private extractDeadline(text: string): string | undefined {
    const patterns = [
      /(?:by|on|for)\s+(\w+\s+\d+|\d+\/\d+|\w+)/i,
      /(tomorrow|today|next\s+\w+|in\s+\d+\s+days)/i,
      /(\d{1,2})[\/-](\d{1,2})/,
      /at\s+(\d{1,2}\s*(?:am|pm))/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract participants from text
   */
  private extractParticipants(text: string): string[] | undefined {
    const patterns = [
      /(?:with|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /(?:meeting|call)\s+(?:with|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return [match[1].trim()];
      }
    }

    return undefined;
  }

  /**
   * Extract location from text
   */
  private extractLocation(text: string): string | undefined {
    const patterns = [
      /(?:at|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /(?:room|office)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Get model status
   */
  getModelStatus(): {
    loaded: boolean;
    categoryModel: boolean;
    priorityModel: boolean;
  } {
    return {
      loaded: this.modelsLoaded,
      categoryModel: false, // Will be updated by status check
      priorityModel: false
    };
  }
}

// Lazy initialization - only create when needed
let multiwozInstance: MultiWOZIntegration | null = null;

function getInstance(): MultiWOZIntegration {
  if (!multiwozInstance) {
    multiwozInstance = new MultiWOZIntegration();
  }
  return multiwozInstance;
}

/**
 * Parse task input using MultiWOZ integration
 */
export async function parseTaskWithMultiWOZ(userInput: string): Promise<MultiWOZResult> {
  return await getInstance().parseTaskInput(userInput);
}

/**
 * Get MultiWOZ model status
 */
export function getMultiWOZStatus() {
  return getInstance().getModelStatus();
}
