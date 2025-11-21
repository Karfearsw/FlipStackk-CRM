import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const event = typeof payload?.event === 'string' ? payload.event : 'unknown'
    const details = typeof payload?.details === 'object' && payload?.details !== null ? payload.details : {}
    const ts = typeof payload?.ts === 'number' ? payload.ts : Date.now()
    const ip = req.headers.get('x-forwarded-for') || 'local'
    console.log('[docs-analytics]', { event, ts, ip, details })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
}