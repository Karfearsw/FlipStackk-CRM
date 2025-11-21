export function trackEvent(event: string, details?: Record<string, any>) {
  const body = JSON.stringify({ event, details: details || {}, ts: Date.now() })
  if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    navigator.sendBeacon('/api/analytics/track', new Blob([body], { type: 'application/json' }))
    return
  }
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  }).catch(() => {})
}