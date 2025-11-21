## Goals
- Produce a working production build and a preview you can open locally and via Vercel
- Prevent secret exposure and ensure integrations (WhatsApp, Discord, Supabase) are safely gated when unconfigured

## Prerequisites
- Move all secrets to environment managers (Vercel Project → Settings → Environment Variables, local `.env.local`) and never commit them
- Rotate any exposed keys (Supabase service role, Postgres password) and replace them in env store
- Set `NEXT_TELEMETRY_DISABLED=1` to disable telemetry noise during CI/build
- If WhatsApp isn’t ready: set `WHATSAPP_ENABLED=false` in env; keep provider disabled

## Local Build & Preview
- Install deps: `npm ci`
- Build: `npm run build` (expect route list and zero type errors)
- Preview production locally: `npm run start` → open `http://localhost:3000/`
- Validate critical flows while authenticated:
  - Dashboard, leads/deals, messaging reactions, notifications drawer (shows login CTA if unauthenticated)
  - Confirm no sensitive data in console/logs

## Vercel Preview Deployment
- Configure env on Vercel: server-only secrets (DB URL, service role), client-safe `NEXT_PUBLIC_*` anon keys
- Disable telemetry: `NEXT_TELEMETRY_DISABLED=1`
- Trigger a Preview deployment; open the generated Preview URL and run the same flow checks

## Observability & Errors
- Ensure API handlers return consistent error shapes `{ error: { message, code } }`
- Use structured logging without secrets; treat WhatsApp webhook and provider logs carefully
- Alert on 5xx spikes; monitor auth failure rates

## Tests & CI
- Run `npm test -- --run` in CI; require all suites green before merge
- Add integration tests for disabled WhatsApp and notifications under 401

## Security Checklist
- Rotate exposed keys immediately; confirm RLS and minimal scopes on Supabase
- Keep service role keys server-only; restrict `NEXT_PUBLIC_*` to anon client keys
- Review config for Discord and Web Push; store secrets only in env

## Next Code Changes (after approval)
- Add `WHATSAPP_ENABLED` gates to provider initialization to eliminate build-time warnings when unconfigured
- Normalize notification drawer UX to avoid fetches when unauthenticated (CTA to log in)
- Standardize API error responses and logging across routes

## Acceptance Criteria
- Local and Vercel previews load with no critical errors
- No secret exposure in logs or client bundles
- Tests pass; critical user flows verified end-to-end