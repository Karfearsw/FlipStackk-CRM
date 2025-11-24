"use client"
import { useEffect } from 'react'

export function MetricsProvider() {
  useEffect(() => {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as any
      const payload = {
        event: 'web_vitals',
        details: {
          ttfb: nav?.responseStart ?? null,
          domContentLoaded: nav?.domContentLoadedEventEnd ?? null,
          loadEventEnd: nav?.loadEventEnd ?? null,
          redirectCount: nav?.redirectCount ?? null,
          transferSize: nav?.transferSize ?? null,
          initiatorType: nav?.initiatorType ?? null,
          ts: Date.now(),
        }
      }
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {})
    } catch {}
  }, [])
  return null
}