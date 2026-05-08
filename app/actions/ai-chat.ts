'use server'

import { streamText } from 'ai'

export async function chat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  mode: 'assistant' | 'task-generate' | 'smart-schedule' | 'productivity'
) {
  const systemPrompts: Record<string, string> = {
    assistant: `You are Alba, a helpful AI assistant. You provide clear, concise, and friendly responses to user questions. You can help with productivity, task management, scheduling, and general advice. Be warm and supportive.`,

    'task-generate': `You are Alba's Task Generator. Analyze the user's message and extract actionable tasks. 

IMPORTANT: When the user says "Create todo [task] schedule on [date]", treat this as ONE SINGLE TASK, not two separate tasks.

Examples:
- "Create todo list Presentation about AI schedule on 28/3" → 1 task: "Presentation about AI" (due: 28/3)
- "Add task Meeting with client schedule tomorrow" → 1 task: "Meeting with client" (due: tomorrow)
- "Make todo Buy groceries schedule today" → 1 task: "Buy groceries" (due: today)

For each task provide:
- A clear, specific title
- An appropriate category (Work, Personal, Academic, Meeting, Planning, Research, Admin, etc.)
- Priority (Low, Medium, High, or Urgent)
- Estimated time (15m, 30m, 1h, 2h, 3h, etc.)

Extract tasks correctly. Return a JSON array with this structure:
[
  { "title": "...", "category": "...", "priority": "...", "estimatedTime": "..." }
]

Start with: "I found X tasks in your message:"
Then provide the JSON array.`,

    'smart-schedule': `You are Alba's Smart Scheduling AI. You help users organize and optimize their schedules. Provide scheduling optimization advice considering:
- Task priorities and deadlines
- Estimated completion times
- Optimal time-of-day recommendations
- Task dependencies and sequencing
- Time blocking strategies
- Energy patterns

Analyze the user's task list and provide actionable schedule recommendations with specific time allocations and ordering.`,

    productivity: `You are Alba's Productivity Coach. You provide motivational and practical productivity advice focused on:
- Time management techniques (Pomodoro, time blocking, batching, etc.)
- Energy and attention management
- Focus and concentration strategies
- Overcoming procrastination and perfectionism
- Sustainable work habits
- Work-life balance

Be encouraging and specific. Provide concrete, immediately actionable advice.`,
  }

  const systemPrompt = systemPrompts[mode]

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: systemPrompt,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    temperature: mode === 'task-generate' ? 0.3 : 0.7,
  })

  return result.toTextStreamResponse()
}
