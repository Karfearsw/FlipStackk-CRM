const { createClient } = require('@supabase/supabase-js')
const { performance } = require('perf_hooks')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://octipyiqduroxelobtli.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdGlweWlxZHVyb3hlbG9idGxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4Njk0NDgsImV4cCI6MjA3NjQ0NTQ0OH0.6zLDVWD7sXFT0FPGLW7rzIVYyRSSg71zTTBV08_Fn3s'

function log(title, obj) {
  console.log(`\n=== ${title} ===`)
  if (obj && typeof obj === 'object') console.log(JSON.stringify(obj, null, 2))
  else if (obj !== undefined) console.log(String(obj))
}

async function run() {
  const results = {
    meta: {
      url: SUPABASE_URL,
      https: SUPABASE_URL.startsWith('https://'),
      timestamp: new Date().toISOString(),
    },
    registration: {},
    login: {},
    passwordReset: {},
    duplicateAccount: {},
    invalidCredentials: {},
    performance: {},
    errors: [],
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const unique = Date.now()
  const testDomain = process.env.TEST_EMAIL_DOMAIN || 'example.com'
  const email = `test${unique}@${testDomain}`
  const password = 'TestPass123!'

  try {
    const t0 = performance.now()
    const { data, error } = await supabase.auth.signUp({ email, password })
    const t1 = performance.now()

    results.registration.duration_ms = Math.round(t1 - t0)
    if (error) {
      results.registration.status = 'failed'
      results.registration.error = { message: error.message, name: error.name, status: error.status }
    } else {
      results.registration.status = 'ok'
      results.registration.user_id = data.user?.id || null
      results.registration.email_confirmed = !!data.user?.email_confirmed_at
      results.registration.session_present = !!data.session
    }
  } catch (e) {
    results.errors.push({ stage: 'registration', message: String(e) })
  }

  try {
    const t0 = performance.now()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    const t1 = performance.now()

    results.login.duration_ms = Math.round(t1 - t0)
    if (error) {
      results.login.status = 'failed'
      results.login.error = { message: error.message, name: error.name, status: error.status }
    } else {
      results.login.status = 'ok'
      results.login.session = {
        access_token_present: !!data.session?.access_token,
        refresh_token_present: !!data.session?.refresh_token,
        expires_at: data.session?.expires_at || null,
      }
    }
  } catch (e) {
    results.errors.push({ stage: 'login', message: String(e) })
  }

  try {
    const t0 = performance.now()
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset` : undefined,
    })
    const t1 = performance.now()

    results.passwordReset.duration_ms = Math.round(t1 - t0)
    if (error) {
      results.passwordReset.status = 'failed'
      results.passwordReset.error = { message: error.message, name: error.name, status: error.status }
    } else {
      results.passwordReset.status = 'ok'
      results.passwordReset.data = data || null
    }
  } catch (e) {
    results.errors.push({ stage: 'passwordReset', message: String(e) })
  }

  try {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      results.duplicateAccount.status = 'rejected'
      results.duplicateAccount.error = { message: error.message, name: error.name, status: error.status }
    } else {
      results.duplicateAccount.status = 'unexpected_success'
    }
  } catch (e) {
    results.errors.push({ stage: 'duplicateAccount', message: String(e) })
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: 'WrongPass456!' })
    if (error) {
      results.invalidCredentials.status = 'rejected'
      results.invalidCredentials.error = { message: error.message, name: error.name, status: error.status }
    } else {
      results.invalidCredentials.status = 'unexpected_success'
      results.invalidCredentials.session = {
        access_token_present: !!data.session?.access_token,
      }
    }
  } catch (e) {
    results.errors.push({ stage: 'invalidCredentials', message: String(e) })
  }

  log('Supabase Auth Live Test Results', results)
}

run().catch((e) => {
  console.error('Fatal error running Supabase auth tests:', e)
  process.exit(1)
})