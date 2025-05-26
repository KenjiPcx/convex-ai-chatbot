import { NextRequest, NextResponse } from 'next/server';

// This route now just redirects to Convex HTTP actions
// All chat functionality is handled by Convex agents

export async function POST(request: NextRequest) {
  try {
    // Get the Convex deployment URL from environment
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Convex URL not configured' },
        { status: 500 }
      );
    }

    // Forward the request to Convex HTTP action
    const body = await request.text();
    
    const response = await fetch(`${convexUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward any authorization headers
        ...(request.headers.get('authorization') && {
          authorization: request.headers.get('authorization')!,
        }),
      },
      body,
    });

    // Return the streaming response from Convex
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/plain',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat route error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
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

    // Forward query parameters
    const searchParams = new URL(request.url).searchParams;
    const queryString = searchParams.toString();
    
    const response = await fetch(`${convexUrl}/api/chat${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        // Forward any authorization headers
        ...(request.headers.get('authorization') && {
          authorization: request.headers.get('authorization')!,
        }),
      },
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Chat GET route error:', error);
    return NextResponse.json(
      { error: 'Failed to get chat data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Convex URL not configured' },
        { status: 500 }
      );
    }

    // Forward query parameters
    const searchParams = new URL(request.url).searchParams;
    const queryString = searchParams.toString();
    
    const response = await fetch(`${convexUrl}/api/chat${queryString ? `?${queryString}` : ''}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // Forward any authorization headers
        ...(request.headers.get('authorization') && {
          authorization: request.headers.get('authorization')!,
        }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Chat DELETE route error:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    );
  }
}