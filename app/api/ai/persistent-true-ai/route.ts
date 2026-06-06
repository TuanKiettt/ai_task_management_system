import { NextRequest, NextResponse } from 'next/server';

/**
 * Persistent True AI API - Calls persistent Python server
 */
export async function POST(request: NextRequest) {
  let message = '';
  let userId = '';
  let context = {};
  
  try {
    const body = await request.json();
    message = body.message || '';
    userId = body.userId || 'anonymous';
    context = body.context || {};

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log(`Persistent True AI Processing: "${message}"`);

    // Call persistent AI server
    const response = await fetch('http://localhost:8888', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId: userId || 'anonymous',
        context: context || {},
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Persistent AI server error: ${response.status}`);
    }

    const result = await response.json();
    console.log(`Persistent True AI Result: ${result.task.title} (${result.task.category})`);

    return NextResponse.json({
      success: true,
      task: result.task,
      prediction: result.prediction,
      confidence: result.confidence,
      model_info: result.model_info,
      message: 'Processed with persistent true AI understanding'
    });

  } catch (error) {
    console.error('Persistent True AI processing error:', error);
    
    // Fallback to LLM API for true AI understanding
    try {
      const llmResponse = await fetch('/api/extract-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: message,
          userId: userId || 'anonymous'
        })
      });

      if (llmResponse.ok) {
        const llmResult = await llmResponse.json();
        if (llmResult.tasks && llmResult.tasks.length > 0) {
          const task = llmResult.tasks[0];
          return NextResponse.json({
            success: true,
            task: {
              title: task.title,
              category: task.category,
              priority: task.priority,
              time: task.estimatedTime,
              date: task.dueDate ? new Date(task.dueDate) : undefined,
              hasDate: !!task.dueDate,
              confidence: 0.85,
              motivationalNote: 'Task extracted using GPT-4o-mini AI',
              source: 'LLM API Fallback'
            },
            prediction: {
              category: 'create_task',
              priority: task.priority,
              confidence: 0.85
            },
            confidence: 0.85,
            model_info: {
              type: 'OpenAI GPT-4o-mini',
              reason: 'Persistent AI server unavailable - using LLM API for true AI understanding'
            }
          });
        }
      }
    } catch (llmError) {
      console.error('LLM API fallback failed:', llmError);
    }
    
    // Final fallback if both fail
    return NextResponse.json({
      success: true,
      task: {
        title: message || 'Unknown task',
        category: 'general',
        priority: 'medium',
        time: 'No time specified',
        confidence: 0.3,
        hasDate: false,
        motivationalNote: 'Task created from message (AI unavailable)',
        source: 'Basic Fallback'
      },
      prediction: {
        category: 'create_task',
        priority: 'medium',
        confidence: 0.3
      },
      confidence: 0.3,
      model_info: {
        type: 'Basic Fallback',
        reason: 'Both AI servers unavailable'
      }
    });
  }
}

export async function GET() {
  try {
    // Check if persistent server is running
    const response = await fetch('http://localhost:8888', {
      method: 'GET',
    });

    if (response.ok) {
      const status = await response.json();
      return NextResponse.json({
        success: true,
        status: status.status,
        message: 'Persistent True AI Server is active and connected'
      });
    } else {
      throw new Error('Server not responding');
    }

  } catch (error) {
    return NextResponse.json({
      success: true,
      status: {
        model_type: 'Persistent Custom-Trained MS-LaTTE + DistilBERT',
        dataset: 'MS-LaTTE (Microsoft Locations and Times of Task Execution)',
        training: 'Completed',
        server_status: 'OFFLINE',
        capabilities: [
          'Natural Language Understanding',
          'Context-Aware Task Extraction',
          'Semantic Classification',
          'Intent Recognition',
          'Entity Extraction',
          'Fast Inference (Persistent Models)'
        ],
        available: false,
        instruction: 'Run: python ai_server.py in python directory'
      },
      message: 'Persistent True AI Server is offline - start python ai_server.py to enable'
    });
  }
}
