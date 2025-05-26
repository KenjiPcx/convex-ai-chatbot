import { NextRequest, NextResponse } from 'next/server';

// Redirect to Convex HTTP actions
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
    
    const response = await fetch(`${convexUrl}/api/document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          authorization: request.headers.get('authorization')!,
        }),
      },
      body,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Document route error:', error);
    return NextResponse.json(
      { error: 'Failed to process document request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Convex URL not configured' },
        { status: 500 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const queryString = searchParams.toString();
    
    const response = await fetch(`${convexUrl}/api/document${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        ...(request.headers.get('authorization') && {
          authorization: request.headers.get('authorization')!,
        }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Document GET route error:', error);
    return NextResponse.json(
      { error: 'Failed to get document' },
      { status: 500 }
    );
  }
}