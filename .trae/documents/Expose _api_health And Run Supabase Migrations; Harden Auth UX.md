## Middleware Update
- Goal: Make `/api/health` unauthenticated for diagnostics.
- Change matcher in `src/proxy.ts` to exclude health endpoint:
  - Current: `src/proxy.ts:31-33`
  - Update to: `'/((?!api/auth|api/register|api/health|_next/static|_next/image|favicon.ico).*)'`
- Add a short comment explaining the purpose of the exclusion.

## Supabase Migration Execution
- Use direct SQL and Drizzle push for full coverage:
1) Apply audit/RLS migration:
   - `psql "<YOUR_SUPABASE_DIRECT_URL>" -f supabase/migrations/20251123_rls_audit.sql`
   - Prefer pooled for app runtime; direct URL OK for admin migration.
2) Push Drizzle schema:
   - Ensure `.env.local` `DATABASE_URL` is Supabase pooled
   - `npm run db:push`
3) Verify in Supabase Studio:
   - Tables: `users`, `leads`, `deals`, `pipeline_stages`, etc.
   - RLS enabled on core tables; audit triggers exist.
4) API endpoint tests post-migration:
   - `/api/register` → 201 success; duplicates → 400/409; invalid → 400
   - `/api/auth` login → success with seeded admin or newly registered user
   - `/api/health` → `status: ok` with database check passing
5) Data integrity:
   - Confirm unique constraints and hashed passwords
   - Insert sample records; verify foreign keys and indices
6) Monitoring:
   - Watch Supabase logs and Vercel build logs for errors; track latency

## Reduce Login/Registration Errors (Practical Hardening)
- Use pooled `DATABASE_URL` everywhere to avoid connection issues
- Keep comprehensive server-side error mapping (already added in `/api/register`)
- Align client/server validation with shared zod schema; ensure role values use the enum
- Add light rate limiting on registration (already present) and per-IP caps
- Consider enabling Supabase Auth for registration/login to offload auth complexity
  - If adopted: use `supabase.auth.signUp` / `signInWithPassword` client-side and wire session to NextAuth if needed
- Add `/api/health` exclusion for easier diagnostics (above)
- Improve logging (structured JSON) and add Sentry for exception capture
- E2E smoke tests on `/auth` using Playwright across browsers; run on preview builds

## Documentation
- Update deployment docs with:
  - Required envs: `DATABASE_URL` (pooled), `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
  - Migration commands and verification steps
  - Error code mappings for registration endpoint
  - Feature flag matrix for stable mode

## Validation Plan
- After changes: run local build, test registration/login flows, review `/api/health` JSON, and confirm no generic 500s on normal cases.

On approval, I will update the middleware matcher to exclude `/api/health`, run the migrations against your Supabase instance, verify in Studio, test endpoints, and document any findings and client-side adjustments.