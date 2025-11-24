const { performance } = require('perf_hooks')

const BASE_URL = process.env.BASE_URL || 'https://flipstackk-crm.vercel.com'
const EMAIL_DOMAIN = process.env.TEST_EMAIL_DOMAIN || 'mailinator.com'

function log(title, obj) {
  console.log(`\n=== ${title} ===`)
  if (obj && typeof obj === 'object') console.log(JSON.stringify(obj, null, 2))
  else if (obj !== undefined) console.log(String(obj))
}

async function json(postUrl, method, body, headers) {
  const t0 = performance.now()
  const res = await fetch(postUrl, {
    method,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const t1 = performance.now()
  const text = await res.text()
  let data = null
  try { data = JSON.parse(text) } catch {}
  return { status: res.status, headers: Object.fromEntries(res.headers.entries()), duration_ms: Math.round(t1 - t0), raw: text, data }
}

async function form(postUrl, formData, headers) {
  const params = new URLSearchParams(formData)
  const t0 = performance.now()
  const res = await fetch(postUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(headers || {}) },
    body: params.toString(),
  })
  const t1 = performance.now()
  const text = await res.text()
  let data = null
  try { data = JSON.parse(text) } catch {}
  return { status: res.status, headers: Object.fromEntries(res.headers.entries()), duration_ms: Math.round(t1 - t0), raw: text, data }
}

async function run() {
  const results = { meta: { base_url: BASE_URL, https: BASE_URL.startsWith('https://'), ts: new Date().toISOString() } }

  const unique = Date.now()
  const creds = {
    username: `testuser_${unique}`,
    email: `test_${unique}@${EMAIL_DOMAIN}`,
    password: 'TestPass123!',
    role: 'caller',
    name: 'Test User',
  }

  const reg = await json(`${BASE_URL}/api/register`, 'POST', creds)
  results.registration = { status: reg.status, duration_ms: reg.duration_ms, body: reg.data || reg.raw, headers: { 'set-cookie': reg.headers['set-cookie'] || null } }

  const csrf = await json(`${BASE_URL}/api/auth/csrf`, 'GET')
  results.csrf = { status: csrf.status, duration_ms: csrf.duration_ms, token_present: !!(csrf.data && csrf.data.csrfToken) }

  const login = await form(`${BASE_URL}/api/auth/callback/credentials`, {
    csrfToken: csrf.data?.csrfToken || '',
    username: creds.username,
    password: creds.password,
    redirect: 'false',
    json: 'true',
  })
  const setCookie = login.headers['set-cookie'] || ''
  const cookieIndicators = [
    setCookie.includes('next-auth.session-token'),
    setCookie.includes('__Secure-next-auth.session-token'),
    setCookie.includes('next-auth.csrf-token'),
  ]
  results.login = { status: login.status, duration_ms: login.duration_ms, body: login.data || login.raw, cookies_present: cookieIndicators.some(Boolean) }

  const sessionHeaders = {}
  if (setCookie) sessionHeaders['Cookie'] = setCookie.split(',')[0]
  const session = await json(`${BASE_URL}/api/auth/session`, 'GET', undefined, sessionHeaders)
  results.session = { status: session.status, duration_ms: session.duration_ms, user_present: !!(session.data && session.data.user), body: session.data || session.raw }

  const dup = await json(`${BASE_URL}/api/register`, 'POST', creds)
  results.duplicate = { status: dup.status, duration_ms: dup.duration_ms, body: dup.data || dup.raw }

  const invalidShort = await json(`${BASE_URL}/api/register`, 'POST', { username: 'ab', password: '123', email: 'bad', role: 'caller', name: 'x' })
  results.invalid_input = { status: invalidShort.status, duration_ms: invalidShort.duration_ms, body: invalidShort.data || invalidShort.raw }

  const badUrl = `${BASE_URL}.invalid`
  let networkOutcome = { status: 'ok' }
  try {
    await json(`${badUrl}/api/health`, 'GET')
  } catch (e) {
    networkOutcome = { status: 'failed', error: String(e) }
  }
  results.network_interruption = networkOutcome

  log('Live Auth Test Results', results)
}

run().catch((e) => { console.error('Fatal test error', e); process.exit(1) })