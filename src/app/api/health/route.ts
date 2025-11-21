import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  const details: Record<string, any> = { timestamp: new Date().toISOString() }
  let ok = true

  try {
    await db.execute(sql`select 1`)
    details.database = { status: 'ok' }
  } catch (e: any) {
    ok = false
    details.database = { status: 'error', message: e?.message }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  details.supabase = { configured: !!supabaseUrl && !!supabaseAnon }

  const nextAuth = process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL
  details.auth = { configured: !!nextAuth }

  return NextResponse.json({ status: ok ? 'ok' : 'degraded', details }, { status: ok ? 200 : 503 })
}