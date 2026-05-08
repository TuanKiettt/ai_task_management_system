import { NextRequest, NextResponse } from 'next/server';
import { parseTaskWithMultiWOZ, getMultiWOZStatus } from '@/lib/multiwoz-integration';

/**
 * Parse task using MultiWOZ models
 */
export async function POST(request: NextRequest) {
  try {
    const { message, userId, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log(`🤖 Parsing task with MultiWOZ: "${message}"`);

    // Parse using MultiWOZ - Call predict API directly for now
    let result;
    try {
      const response = await fetch('http://localhost:3000/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      const data = await response.json();
      
      if (data.success) {
        result = {
          success: true,
          prediction: data.prediction,
          fallback: data.usedFallback || false
        };
      } else {
        throw new Error('Predict API failed');
      }
    } catch (error) {
      console.log('Predict API failed, using fallback integration');
      result = await parseTaskWithMultiWOZ(message);
    }

    if (result.success && result.prediction) {
      console.log(`✅ MultiWOZ parsed: ${result.prediction.category} (${result.prediction.priority})`);

      // Create task based on prediction
      const taskData = createTaskFromPrediction(result.prediction, message, userId);

      // Save task to database
      if (taskData) {
        try {
          const createdTask = await saveTaskToDatabase(taskData);
          
          // Create notification
          await createSuccessNotification(createdTask, userId);

          return NextResponse.json({
            success: true,
            task: createdTask,
            prediction: result.prediction,
            usedFallback: result.fallback || false,
            message: `✅ Created task: ${createdTask.title}`
          });

        } catch (dbError) {
          console.error('Database error:', dbError);
          
          // Return prediction without saving to database
          return NextResponse.json({
            success: true,
            prediction: result.prediction,
            task: taskData,
            usedFallback: result.fallback || false,
            savedToDatabase: false,
            message: `⚠️ Task parsed but not saved: ${taskData.title}`
          });
        }
      }
    }

    return NextResponse.json({
      success: false,
      error: result.error || 'Failed to parse task',
      usedFallback: result.fallback || false
    });

  } catch (error) {
    console.error('MultiWOZ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get MultiWOZ model status
 */
export async function GET() {
  try {
    const status = getMultiWOZStatus();
    
    return NextResponse.json({
      success: true,
      status,
      message: status.loaded ? '✅ MultiWOZ models loaded' : '⚠️ Using rule-based fallback'
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}

/**
 * Train MultiWOZ models (Disabled for now)
 */
export async function PUT() {
  try {
    console.log('🚀 MultiWOZ model training is disabled');
    
    return NextResponse.json({
      success: false,
      message: '❌ Model training disabled - models already trained'
    });

  } catch (error) {
    console.error('Training error:', error);
    return NextResponse.json(
      { error: 'Training failed' },
      { status: 500 }
    );
  }
}

/**
 * Smart task title extraction based on category and message content
 */
function extractSmartTaskTitle(message: string, category: string): string {
  const text = message.toLowerCase();
  
  // Remove common prefixes
  let cleanMessage = text.replace(/^(i need to|i want to|can you|please|i have|i have a|create|add|make|schedule)/i, '').trim();
  
  // Extract title based on category
  switch (category) {
    case 'schedule_appointment':
      // For appointments, extract the subject intelligently using AI-like patterns
      return extractAppointmentTitle(cleanMessage);
      
    case 'schedule_meeting':
      return extractMeetingTitle(cleanMessage);
      
    case 'schedule_deadline':
      return extractDeadlineTitle(cleanMessage);
      
    case 'book_resource':
      return extractResourceTitle(cleanMessage);
      
    case 'plan_activity':
      return extractActivityTitle(cleanMessage);
      
    case 'arrange_transport':
      return extractTransportTitle(cleanMessage);
      
    case 'handle_emergency':
      return extractEmergencyTitle(cleanMessage);
      
    default:
      // For general tasks, be smarter about extraction
      if (cleanMessage.includes('presentation') || cleanMessage.includes('report') || cleanMessage.includes('project')) {
        return extractDeadlineTitle(cleanMessage);
      }
      return extractGeneralTitle(cleanMessage);
  }
}

/**
 * Extract appointment title from message using intelligent patterns
 */
function extractAppointmentTitle(message: string): string {
  // Pattern 1: "I have a [subject] class"
  const classPattern = /(?:i have|i have a|have|attend|join)\s+(.+?)\s+class/i;
  let match = message.match(classPattern);
  if (match && match[1]) {
    const subject = match[1].trim();
    return `${subject.charAt(0).toUpperCase() + subject.slice(1)} Class`;
  }
  
  // Pattern 2: "[subject] class"
  const simpleClassPattern = /(.+?)\s+class/i;
  match = message.match(simpleClassPattern);
  if (match && match[1]) {
    const subject = match[1].trim();
    return `${subject.charAt(0).toUpperCase() + subject.slice(1)} Class`;
  }
  
  // Pattern 3: "class in [subject]" or "class about [subject]"
  const classInPattern = /class\s+(?:in|about|on)\s+(.+?)(?:\s+(?:in|on|at|by|$))/i;
  match = message.match(classInPattern);
  if (match && match[1]) {
    const subject = match[1].trim();
    return `${subject.charAt(0).toUpperCase() + subject.slice(1)} Class`;
  }
  
  // Pattern 4: Meeting patterns
  if (message.includes('meeting')) {
    return extractMeetingTitle(message);
  }
  
  // Pattern 5: Appointment patterns
  if (message.includes('appointment') || message.includes('doctor') || message.includes('dentist')) {
    return 'Doctor Appointment';
  }
  
  // Pattern 6: General appointment - extract the main activity
  const activityPattern = /(.+?)(?:\s+(?:in|on|at|by|$))/i;
  match = message.match(activityPattern);
  if (match && match[1]) {
    let activity = match[1].trim();
    
    // Clean up common words
    activity = activity.replace(/\b(i|have|need|want|going to|will|a|an|the)\b/gi, '').trim();
    
    // Capitalize properly
    if (activity.length > 0) {
      return activity.charAt(0).toUpperCase() + activity.slice(1);
    }
  }
  
  return 'Appointment';
}

/**
 * Extract meeting title from message
 */
function extractMeetingTitle(message: string): string {
  // Pattern 1: "I have a meeting" - simple meeting without subject
  if (message.includes('meeting') && !message.includes('with') && !message.includes('about') && !message.includes('for')) {
    return 'Meeting';
  }
  
  // Pattern 2: "meeting with [person]"
  const withPattern = /meeting\s+with\s+(.+?)(?:\s+(?:in|on|at|by|$))/i;
  let match = message.match(withPattern);
  if (match && match[1]) {
    return `Meeting: ${match[1].trim()}`;
  }
  
  // Pattern 3: "meeting about [subject]"
  const aboutPattern = /meeting\s+about\s+(.+?)(?:\s+(?:in|on|at|by|$))/i;
  match = message.match(aboutPattern);
  if (match && match[1]) {
    return `Meeting: ${match[1].trim()}`;
  }
  
  // Pattern 4: "meeting for [purpose]"
  const forPattern = /meeting\s+for\s+(.+?)(?:\s+(?:in|on|at|by|$))/i;
  match = message.match(forPattern);
  if (match && match[1]) {
    return `Meeting: ${match[1].trim()}`;
  }
  
  // Pattern 5: "discuss [topic]"
  const discussPattern = /(?:discuss|talk about)\s+(.+?)(?:\s+(?:in|on|at|by|$))/i;
  match = message.match(discussPattern);
  if (match && match[1]) {
    return `Meeting: ${match[1].trim()}`;
  }
  
  // Pattern 6: "[subject] meeting"
  const subjectMeetingPattern = /(.+?)\s+meeting/i;
  match = message.match(subjectMeetingPattern);
  if (match && match[1]) {
    return `Meeting: ${match[1].trim()}`;
  }
  
  // Default fallback
  return 'Meeting';
}

/**
 * Extract deadline title from message
 */
function extractDeadlineTitle(message: string): string {
  // Special handling for presentations
  if (message.includes('presentation')) {
    const presentationPattern = /(?:prepare|create|make|give)\s+(.+?)presentation(?:\s+(?:about|on|regarding)\s+(.+?))?(?:\s+(?:in|on|at|by|$))/i;
    const match = message.match(presentationPattern);
    
    if (match) {
      let title = '';
      if (match[2]) {
        // "prepare presentation about AI"
        title = match[2].trim();
      } else if (match[1]) {
        // "prepare AI presentation" 
        title = match[1].trim();
      }
      
      // Clean up common words
      title = title.replace(/\b(a|an|the|my|your|our|their)\b/gi, '').trim();
      
      // Capitalize properly
      title = title.charAt(0).toUpperCase() + title.slice(1);
      
      return `Prepare: ${title} Presentation`;
    }
  }
  
  const patterns = [
    /(?:finish|complete|submit|due)\s+(.+?)(?:\s+(?:by|in|on|at|$))/i,
    /(.+?)\s+(?:deadline|due)/i,
    /(?:prepare|prepare for|create|make)\s+(.+?)(?:\s+(?:in\s+\d{1,2}[\/\-]\d{1,2}|on|at|by|$))/i,
    /(.+?)\s+(?:report|project|assignment)(?:\s+(?:in|on|at|by|$))/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      let title = match[1].trim();
      
      // Clean up common words
      title = title.replace(/\b(a|an|the|my|your|our|their)\b/gi, '').trim();
      
      // Capitalize properly
      title = title.charAt(0).toUpperCase() + title.slice(1);
      
      // Add appropriate prefix
      if (message.includes('report')) {
        return `Report: ${title}`;
      } else if (message.includes('project')) {
        return `Project: ${title}`;
      } else if (message.includes('assignment')) {
        return `Assignment: ${title}`;
      } else {
        return `Deadline: ${title}`;
      }
    }
  }
  
  return 'Deadline';
}

/**
 * Extract resource title from message
 */
function extractResourceTitle(message: string): string {
  const patterns = [
    /book\s+(.+?)(?:\s+(?:in|on|at|for|$))/i,
    /reserve\s+(.+?)(?:\s+(?:in|on|at|for|$))/i,
    /(.+?)\s+(?:room|resource|equipment)/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return `Book: ${match[1].trim()}`;
    }
  }
  
  return 'Book Resource';
}

/**
 * Extract activity title from message
 */
function extractActivityTitle(message: string): string {
  const patterns = [
    /(?:organize|plan|arrange)\s+(.+?)(?:\s+(?:in|on|at|for|$))/i,
    /(.+?)\s+(?:activity|event|party)/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return `Activity: ${match[1].trim()}`;
    }
  }
  
  return 'Activity';
}

/**
 * Extract transport title from message
 */
function extractTransportTitle(message: string): string {
  const patterns = [
    /(?:book|order|call)\s+(.+?)(?:\s+(?:to|from|at|$))/i,
    /(.+?)\s+(?:taxi|uber|ride|bus|transport)/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return `Transport: ${match[1].trim()}`;
    }
  }
  
  return 'Arrange Transport';
}

/**
 * Extract emergency title from message
 */
function extractEmergencyTitle(message: string): string {
  const patterns = [
    /(?:emergency|urgent|asap)\s+(.+?)(?:\s+(?:in|on|at|for|$))/i,
    /(.+?)\s+(?:emergency|urgent)/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return `Emergency: ${match[1].trim()}`;
    }
  }
  
  return 'Emergency Task';
}

/**
 * Extract general title when specific patterns don't match
 */
function extractGeneralTitle(message: string): string {
  // Remove date/time patterns to get the core task
  let coreTask = message
    .replace(/(?:in|on|for|at)\s+\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?/i, '') // Remove dates
    .replace(/(?:in|on|for|at)\s+(tomorrow|today|tonight)/i, '') // Remove relative dates
    .replace(/(?:in|on|for|at)\s+(next\s+)?\w+/i, '') // Remove day references
    .replace(/\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)/i, '') // Remove times
    .replace(/\b(in|on|for|at|by)\b/gi, '') // Remove prepositions
    .trim();
  
  // If still long, take first few words but be smarter about it
  if (coreTask.length > 60) {
    const words = coreTask.split(' ');
    // Try to find a good breaking point
    let breakPoint = 8;
    for (let i = 5; i < Math.min(words.length, 10); i++) {
      if (words[i].includes('presentation') || words[i].includes('report') || words[i].includes('project')) {
        breakPoint = i + 1;
        break;
      }
    }
    coreTask = words.slice(0, breakPoint).join(' ');
  }
  
  // Clean up extra spaces and trailing words
  coreTask = coreTask.replace(/\s+/g, ' ').trim();
  
  // Capitalize first letter
  if (coreTask) {
    return coreTask.charAt(0).toUpperCase() + coreTask.slice(1);
  }
  
  return 'Task';
}

/**
 * Create task data from MultiWOZ prediction
 */
function createTaskFromPrediction(prediction: any, originalMessage: string, userId?: string) {
  // Smart task title extraction from message
  let title = extractSmartTaskTitle(originalMessage, prediction.category);
  
  // Clean up the title
  title = title.replace(/^(i need to|i want to|can you|please|i have|i have a)/i, '').trim();
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Map category to task category
  const categoryMap: Record<string, string> = {
    'schedule_meeting': 'Meeting',
    'schedule_deadline': 'Deadline',
    'schedule_appointment': 'Appointment',
    'book_resource': 'Resource',
    'plan_activity': 'Activity',
    'arrange_transport': 'Transport',
    'handle_emergency': 'Emergency',
    'create_task': 'General'
  };

  // Estimate time based on category
  const timeMap: Record<string, string> = {
    'schedule_meeting': '1h',
    'schedule_deadline': '30m',
    'schedule_appointment': '1h',
    'book_resource': '15m',
    'plan_activity': '2h',
    'arrange_transport': '30m',
    'handle_emergency': '1h',
    'create_task': '1h'
  };

  const taskData = {
    title,
    description: `Created from: "${originalMessage}"`,
    category: categoryMap[prediction.category] || 'General',
    priority: prediction.priority.charAt(0).toUpperCase() + prediction.priority.slice(1),
    estimatedTime: timeMap[prediction.category] || '1h',
    dueDate: prediction.deadline ? normalizeDate(prediction.deadline) : null,
    status: 'new' as const,
    userId: userId || 'anonymous',
    participants: prediction.participants || [],
    location: prediction.location || null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return taskData;
}

/**
 * Normalize date string to standard format
 */
function normalizeDate(dateString: string): string | null {
  try {
    const now = new Date();
    
    // Handle relative dates
    const lower = dateString.toLowerCase();
    
    if (lower === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    
    if (lower === 'today') {
      return now.toISOString().split('T')[0];
    }
    
    if (lower.startsWith('next ')) {
      const dayName = lower.replace('next ', '').trim();
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = daysOfWeek.indexOf(dayName);
      
      if (targetDay !== -1) {
        const currentDay = now.getDay();
        const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + daysUntil);
        return targetDate.toISOString().split('T')[0];
      }
    }
    
    if (lower.startsWith('in ')) {
      const match = lower.match(/in (\d+) days?/);
      if (match) {
        const days = parseInt(match[1]);
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + days);
        return targetDate.toISOString().split('T')[0];
      }
    }
    
    // Handle date formats like "28/3", "March 28", "in 28/3"
    const datePatterns = [
      /in\s+(\d{1,2})[\/-](\d{1,2})/, // in 28/3
      /(\d{1,2})[\/-](\d{1,2})/, // 28/3 or 28-3
      /(\w+)\s+(\d{1,2})/, // March 28
    ];
    
    for (const pattern of datePatterns) {
      const match = dateString.match(pattern);
      if (match) {
        let month: number, day: number;
        
        // Adjust match index for "in 28/3" pattern
        const dayIndex = pattern === datePatterns[0] ? 1 : 1;
        const monthIndex = pattern === datePatterns[0] ? 2 : 2;
        
        if (pattern === datePatterns[0] || pattern === datePatterns[1]) {
          // Numeric format
          day = parseInt(match[dayIndex]);
          month = parseInt(match[monthIndex]) - 1; // JS months are 0-indexed
        } else {
          // Text format
          const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                           'july', 'august', 'september', 'october', 'november', 'december'];
          month = monthNames.indexOf(match[1].toLowerCase());
          day = parseInt(match[2]);
        }
        
        if (month !== -1 && day > 0 && day <= 31) {
          const targetDate = new Date(now.getFullYear(), month, day);
          
          // If date is in the past, assume next year
          if (targetDate < now) {
            targetDate.setFullYear(now.getFullYear() + 1);
          }
          
          // Use UTC to avoid timezone issues
          const utcDate = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
          return utcDate.toISOString().split('T')[0];
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Date normalization error:', error);
    return null;
  }
}

/**
 * Save task to database
 */
async function saveTaskToDatabase(taskData: any) {
  // This would typically use Prisma or your database client
  // For now, we'll simulate the database save
  
  console.log('💾 Saving task to database:', taskData.title);
  
  // Simulate database insert
  const savedTask = {
    ...taskData,
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  
  // TODO: Replace with actual database save
  // Example with Prisma:
  // return await prisma.task.create({ data: taskData });
  
  return savedTask;
}

/**
 * Create success notification
 */
async function createSuccessNotification(task: any, userId?: string) {
  const notification = {
    title: '✅ Task Created Successfully',
    message: `"${task.title}" has been added to your tasks${task.dueDate ? ` (due: ${task.dueDate})` : ''}`,
    type: 'success' as const,
    category: 'task' as const,
    read: false,
    userId: userId || 'anonymous',
    createdAt: new Date(),
    timestamp: Date.now()
  };
  
  console.log('📩 Creating notification:', notification.title);
  
  // TODO: Save notification to database
  // Example with Prisma:
  // await prisma.notification.create({ data: notification });
  
  return notification;
}
