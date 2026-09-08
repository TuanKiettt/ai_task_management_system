import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const configured = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    
    return NextResponse.json({
      success: true,
      status: {
        loaded: configured,
        provider: 'Google Gemini',
        model: 'gemini-2.0-flash',
        mode: 'api',
      },
      message: configured ? 'Gemini AI is configured' : 'Gemini API key is not configured'
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({
      success: false,
      status: {
        loaded: false,
        provider: 'Google Gemini',
      },
      error: 'Failed to check model status',
      message: 'Error checking status'
    }, { status: 500 });
  }
}
