import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const details = {
      timestamp: new Date().toISOString(),
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: {
        node: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV || 'development'
      }
    };

    return NextResponse.json(
      { 
        status: 'ok', 
        details
      }, 
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  } catch (error: any) {
    console.error('Basic health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error?.message || 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  }
}