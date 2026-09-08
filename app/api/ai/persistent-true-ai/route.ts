import { NextRequest, NextResponse } from 'next/server'
import { POST as extractTasks } from '@/app/api/extract-tasks/route'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const userId = body.userId || 'anonymous'

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const extractionRequest = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: message, userId }),
    })
    const extractionResponse = await extractTasks(extractionRequest)
    const extraction = await extractionResponse.json()
    const task = extraction.tasks?.[0]

    if (!task) {
      return NextResponse.json({ error: 'No task found', tasks: [] }, { status: 422 })
    }

    return NextResponse.json({
      success: true,
      task: {
        title: task.title,
        category: task.category,
        priority: task.priority,
        time: task.estimatedTime,
        date: task.dueDate || undefined,
        hasDate: Boolean(task.dueDate),
        confidence: 0.85,
        motivationalNote: 'Task extracted using Gemini AI',
        source: 'Google Gemini',
      },
      confidence: 0.85,
      model_info: { type: 'Google Gemini' },
    })
  } catch (error) {
    console.error('Gemini task extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract task', success: false },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    status: {
      loaded: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
      provider: 'Google Gemini',
      model: 'gemini-2.0-flash',
    },
  })
}
