import { NextRequest, NextResponse } from 'next/server';

// Redirect to Convex Auth HTTP actions
export async function POST(request: NextRequest) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Convex URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${convexUrl}/api/auth/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Guest auth route error:', error);
    return NextResponse.json(
      { error: 'Failed to create guest user' },
      { status: 500 }
    );
  }
}