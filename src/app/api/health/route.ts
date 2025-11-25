import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { logger, PerformanceMonitor } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const endTimer = PerformanceMonitor.startTimer('health_check');
  const details: Record<string, any> = { 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  }
  let ok = true
  let statusCode = 200

  try {
    // Database health check - try direct database first, fallback to Supabase
    const dbStart = Date.now();
    await db.execute(sql`select 1`)
    details.database = { 
      status: 'ok',
      responseTime: Date.now() - dbStart,
      connectionType: 'direct'
    }
  } catch (e: any) {
    // Direct database connection failed, try Supabase fallback
    logger.warn('Health check: Direct database connection failed, trying Supabase fallback', {
      component: 'health-check',
      service: 'database',
      errorType: e?.code || 'unknown',
      errorMessage: e?.message
    });
    
    try {
      const fallbackStart = Date.now();
      const { data, error } = await supabase.from('users').select('id').limit(1);
      if (error) throw error;
      
      details.database = { 
        status: 'ok',
        responseTime: Date.now() - fallbackStart,
        connectionType: 'supabase-fallback',
        fallbackReason: e?.message
      }
      logger.info('Health check: Database fallback to Supabase successful', {
        component: 'health-check',
        service: 'database',
        fallbackReason: e?.message
      });
    } catch (fallbackError: any) {
      ok = false
      statusCode = 503
      details.database = { 
        status: 'error', 
        message: fallbackError?.message,
        responseTime: -1,
        connectionString: process.env.DATABASE_URL ? 'configured' : 'missing',
        errorType: fallbackError?.code || 'unknown',
        primaryError: e?.message,
        fallbackError: fallbackError?.message
      }
      logger.error('Health check: Both database connections failed', {
        component: 'health-check',
        service: 'database',
        primaryError: e?.message,
        fallbackError: fallbackError?.message,
        errorType: 'dual_failure'
      });
    }
  }

  try {
    // Supabase health check
    const supabaseStart = Date.now();
    const { data, error } = await supabase.from('users').select('id').limit(1);
    details.supabase = { 
      configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      status: error ? 'error' : 'ok',
      responseTime: Date.now() - supabaseStart,
      error: error?.message
    }
    
    if (error) {
      logger.error('Health check: Supabase connection failed', error, {
        component: 'health-check',
        service: 'supabase'
      });
    }
  } catch (e: any) {
    details.supabase = { 
      configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      status: 'error',
      error: e?.message
    }
  }

  // Authentication system health check
  const nextAuth = process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL
  details.auth = { 
    configured: !!nextAuth,
    status: nextAuth ? 'ok' : 'warning'
  }

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

  const responseTime = endTimer();
  details.performance = {
    responseTime: Math.round(responseTime),
    averageResponseTime: Math.round(PerformanceMonitor.getAverageMetric('health_check'))
  }

  // Determine overall status
  const status = ok ? 'ok' : 'degraded'
  
  logger.info('Health check completed', {
    component: 'health-check',
    status,
    responseTime: Math.round(responseTime),
    databaseStatus: details.database.status,
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
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  )
}