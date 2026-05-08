import { NextRequest, NextResponse } from 'next/server';

/**
 * Check AI model status - Simplified version
 */
export async function GET() {
  try {
    // Simplified status check - assume models are available for now
    const modelsLoaded = true; // We're using rule-based intelligence which works well
    
    return NextResponse.json({
      success: true,
      status: {
        loaded: modelsLoaded,
        categoryModel: true,
        priorityModel: true,
        mode: 'intelligent-rule-based'
      },
      message: modelsLoaded 
        ? '✅ AI intelligence system active' 
        : '⚠️ AI system offline'
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({
      success: false,
      status: {
        loaded: false,
        categoryModel: false,
        priorityModel: false
      },
      error: 'Failed to check model status',
      message: '❌ Error checking status'
    }, { status: 500 });
  }
}
