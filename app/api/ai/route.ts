import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple AI response simulation
    const responses = [
      "That's an interesting question! Let me think about that...",
      "I understand your point. Here's what I think...",
      "Based on what you've shared, I would suggest...",
      "That's a great observation! To build on that...",
      "I can help you with that. Let me explain...",
      "Excellent question! Here's my perspective...",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return NextResponse.json({
      response: randomResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in AI API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'CHATGPT API is running',
      endpoints: {
        POST: 'Send a message to get an AI response'
      }
    },
    { status: 200 }
  );
}