export class ChatEngine {
  async generateResponseStream(messages: Array<{ role: 'user' | 'assistant'; content: string }>, mode: 'assistant' | 'task-generate' | 'smart-schedule' | 'productivity') {
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage?.content || '';
    
    console.log(`🤖 ChatEngine (${mode}): "${userContent}"`);

    let response = '';

    if (mode === 'task-generate') {
      // Use MultiWOZ AI for task generation
      try {
        const timestamp = Date.now();
        const aiResponse = await fetch(`http://localhost:3000/api/ai/multiwoz?t=${timestamp}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify({ message: userContent })
        });
        
        const data = await aiResponse.json();
        
        if (data.success && data.task) {
          response = `I found 1 task in your message:
[
  { 
    "title": "${data.task.title}", 
    "category": "${data.task.category}", 
    "priority": "${data.task.priority}", 
    "estimatedTime": "${data.task.estimatedTime}" 
  }
]

Due date: ${data.task.dueDate || 'Not specified'}

${data.usedFallback ? '(Using rule-based analysis)' : '(AI-powered analysis)'}
Confidence: ${data.prediction?.confidence || 0.85}`;
        } else {
          response = 'I couldn\'t extract any tasks from your message. Please try describing your tasks more clearly.';
        }
      } catch (error) {
        console.error('Task generation error:', error);
        response = 'Sorry, I had trouble processing your task. Please try again.';
      }
    } else {
      // General assistant mode with contextual responses
      response = this.generateAssistantResponse(userContent, mode);
    }

    // Return as async iterator to match expected interface
    const chunks = [response];
    
    return {
      async *[Symbol.asyncIterator]() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }
    };
  }

  /**
   * Generate contextual assistant responses
   */
  private generateAssistantResponse(message: string, mode: string): string {
    const lower = message.toLowerCase();
    
    // Greeting responses
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return `Hello! I'm Alba, your AI assistant. I can help you with:

📋 **Task Management** - Extract and organize tasks from your descriptions
📅 **Smart Scheduling** - Optimize your time and schedule
🎯 **Productivity Tips** - Get personalized advice for better focus
💬 **General Chat** - Answer questions and provide assistance

How can I help you today?`;
    }
    
    // Task-related responses
    if (lower.includes('task') || lower.includes('todo') || lower.includes('schedule')) {
      return `I can help you manage tasks! Here's what I can do:

📝 **Extract Tasks**: Just describe what you need to do, and I'll create organized tasks for you
📅 **Schedule Tasks**: Tell me when you want things done, and I'll help you plan
🎯 **Prioritize**: I can help you figure out what's most important

Try saying something like:
- "I need to finish the presentation by Friday"
- "Schedule team meetings for next week"
- "Help me organize my project tasks"

What would you like to work on?`;
    }
    
    // Productivity tips
    if (lower.includes('productivity') || lower.includes('focus') || lower.includes('motivation')) {
      return `Here are some productivity tips to boost your efficiency:

⏰ **Time Management**
- Use the Pomodoro Technique: 25 minutes focused work, 5 minutes break
- Time blocking: Schedule specific tasks for specific time slots
- Eat the frog: Tackle your hardest task first thing in the morning

🎯 **Focus Strategies**
- Minimize distractions by turning off notifications
- Use the 2-minute rule: If it takes less than 2 minutes, do it now
- Take regular breaks to maintain mental clarity

💪 **Energy Management**
- Match difficult tasks to your peak energy hours
- Stay hydrated and maintain good posture
- Get enough quality sleep

What specific productivity challenge are you facing?`;
    }
    
    // Scheduling help
    if (lower.includes('schedule') || lower.includes('calendar') || lower.includes('meeting')) {
      return `I can help you optimize your schedule! Here's how:

📅 **Smart Scheduling**
- I can extract tasks and suggest optimal timing
- Help you avoid overbooking and conflicts
- Suggest the best times for different types of activities

🤝 **Meeting Management**
- Extract meeting details from natural language
- Help you prepare agendas and follow-ups
- Suggest optimal meeting times based on participants

⚡ **Efficiency Tips**
- Batch similar activities together
- Schedule deep work sessions when you're most focused
- Build in buffer time between meetings

Just describe your scheduling needs, and I'll help you organize them!`;
    }
    
    // Default response
    return `I'm here to help! I can assist you with:

📋 **Task Management** - Extract and organize tasks
📅 **Smart Scheduling** - Plan and optimize your time  
🎯 **Productivity** - Tips for better focus and efficiency
💬 **Questions** - General assistance and information

What would you like help with today? You can ask me anything or describe a task you need to accomplish.`;
  }
}

let chatEngineInstance: ChatEngine | null = null

export function getChatEngine(): ChatEngine {
  if (!chatEngineInstance) {
    chatEngineInstance = new ChatEngine()
  }
  return chatEngineInstance
}
