import { NextResponse } from 'next/server'
import { logger, PerformanceMonitor } from '@/lib/logger'

export async function GET() {
  const endTimer = PerformanceMonitor.startTimer('simple_health_check');
  const details: Record<string, any> = { 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  }

  try {
    // Basic system health checks
    
    // Memory usage monitoring
    const memUsage = process.memoryUsage();
    details.memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      status: memUsage.heapUsed / memUsage.heapTotal > 0.9 ? 'warning' : 'ok'
    }

    // Environment configuration check
    details.environment = {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      requiredEnvVars: {
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        DATABASE_URL: !!process.env.DATABASE_URL,
      }
    }

    // Feature flags status
    details.features = {
      whatsapp: process.env.FEATURE_WHATSAPP === 'true',
      discord: process.env.FEATURE_DISCORD === 'true',
      marketingAutomation: process.env.FEATURE_MARKETING_AUTOMATION === 'true',
    }

    // Basic connectivity test (no database required)
    details.connectivity = {
      server: 'ok',
      timestamp: new Date().toISOString()
    }

    const responseTime = endTimer();
    details.performance = {
      responseTime: Math.round(responseTime),
      averageResponseTime: Math.round(PerformanceMonitor.getAverageMetric('simple_health_check'))
    }

    const status = 'ok'
    
    logger.info('Simple health check completed', {
      component: 'health-check',
      status,
      responseTime: Math.round(responseTime),
      memoryStatus: details.memory.status
    });

    return NextResponse.json(
      { 
        status, 
        details,
        _meta: {
          version: '1.0',
          checkTime: Date.now() - details.timestamp
        }
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
    logger.error('Simple health check failed', error, {
      component: 'health-check',
      errorMessage: error?.message
    });

    return NextResponse.json(
      { 
        status: 'error',
        error: error?.message,
        details
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