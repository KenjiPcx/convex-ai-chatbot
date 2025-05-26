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

    // Forward the FormData directly for file uploads
    const formData = await request.formData();
    
    const response = await fetch(`${convexUrl}/api/files/upload`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData - let fetch handle it
        ...(request.headers.get('authorization') && {
          authorization: request.headers.get('authorization')!,
        }),
      },
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('File upload route error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}