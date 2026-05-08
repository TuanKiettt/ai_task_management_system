import { NextRequest, NextResponse } from 'next/server';

/**
 * Persistent True AI API - Calls persistent Python server
 */
export async function POST(request: NextRequest) {
  let message = '';
  
  try {
    const body = await request.json();
    message = body.message || '';
    const { userId, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log(`🧠 Persistent True AI Processing: "${message}"`);

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
    console.log(`✅ Persistent True AI Result: ${result.task.title} (${result.task.category})`);

    return NextResponse.json({
      success: true,
      task: result.task,
      prediction: result.prediction,
      confidence: result.confidence,
      model_info: result.model_info,
      message: '✅ Processed with persistent true AI understanding'
    });

  } catch (error) {
    console.error('Persistent True AI processing error:', error);
    
    // Check if server is not running
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
      return NextResponse.json({
        success: true,
        task: {
          title: message || 'Unknown task',
          category: 'general',
          priority: 'medium',
          time: 'No time specified',
          confidence: 0.5,
          hasDate: false,
          motivationalNote: 'Task created from message (persistent AI server not running)',
          source: 'AI Fallback'
        },
        prediction: {
          category: 'create_task',
          priority: 'medium',
          confidence: 0.5
        },
        confidence: 0.5,
        model_info: {
          type: 'Rule-based Fallback',
          reason: 'Persistent AI server not running - please start python ai_server.py'
        }
      });
    }
    
    // Fallback to rule-based if AI fails
    return NextResponse.json({
      success: true,
      task: {
        title: message || 'Unknown task',
        category: 'general',
        priority: 'medium',
        time: 'No time specified',
        confidence: 0.5,
        hasDate: false,
        motivationalNote: 'Task created from message (AI fallback)',
        source: 'AI Fallback'
      },
      prediction: {
        category: 'create_task',
        priority: 'medium',
        confidence: 0.5
      },
      confidence: 0.5,
      model_info: {
        type: 'Rule-based Fallback',
        reason: 'Persistent true AI model unavailable'
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
        message: '🧠 Persistent True AI Server is active and connected'
      });
    } else {
      throw new Error('Server not responding');
    }

  } catch (error) {
    return NextResponse.json({
      success: true,
      status: {
        model_type: 'Persistent Custom-Trained MultiWOZ + DistilBERT',
        dataset: 'MultiWOZ v22 + Public Datasets (IMDB, AG News, SQuAD, GLUE)',
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
      message: '🔌 Persistent True AI Server is offline - start python ai_server.py to enable'
    });
  }
}
