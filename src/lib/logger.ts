export function logInfo(message: string, details?: any) {
  try {
    console.log(JSON.stringify({ level: 'info', message, details, ts: Date.now() }));
  } catch {}
}

export function logError(message: string, details?: any) {
  try {
    console.error(JSON.stringify({ level: 'error', message, details, ts: Date.now() }));
  } catch {}
}