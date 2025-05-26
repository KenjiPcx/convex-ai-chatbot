import { NextRequest, NextResponse } from 'next/server';

// Redirect to Convex Auth HTTP actions
export async function GET(request: NextRequest) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Convex URL not configured' },
        { status: 500 }
      );
    }

    // Forward the path to Convex auth
    const pathname = new URL(request.url).pathname;
    const searchParams = new URL(request.url).searchParams;
    const queryString = searchParams.toString();
    
    const response = await fetch(`${convexUrl}/api/auth${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        ...(request.headers.get('authorization') && {
          authorization: request.headers.get('authorization')!,
        }),
      },
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Auth GET route error:', error);
    return NextResponse.json(
      { error: 'Failed to process auth request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Convex URL not configured' },
        { status: 500 }
      );
    }

    const body = await request.text();
    
    const response = await fetch(`${convexUrl}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          authorization: request.headers.get('authorization')!,
        }),
      },
      body,
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Auth POST route error:', error);
    return NextResponse.json(
      { error: 'Failed to process auth request' },
      { status: 500 }
    );
  }
}