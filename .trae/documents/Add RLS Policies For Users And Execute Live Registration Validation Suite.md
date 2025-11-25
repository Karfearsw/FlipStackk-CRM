## Objectives
- Fix registration by adding proper RLS `INSERT/UPDATE` policies on `public.users` targeted to the correct runtime role.
- Execute a live registration test suite with latency and success metrics, verify data integrity, and produce a concise validation report.

## Preconditions
- Confirm Supabase instance and credentials.
- Identify server connection role used by the app (e.g., `authenticated`, `service_role`, or `postgres`):
  - Query `select current_user;` and `select current_setting('role');` using the same `DATABASE_URL` the app uses.
- Ensure app uses pooled `DATABASE_URL` (port `6543`, `?pgbouncer=true&connection_limit=1`) for stability.

## RLS Policy Implementation
1) Enable RLS on `public.users` (if not already):
- `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;`

2) Create role-targeted policies (choose based on identified runtime role):
- If app uses Supabase `authenticated` role (typical for client-key based access):
  - `CREATE POLICY users_insert_authenticated ON public.users FOR INSERT TO authenticated WITH CHECK (true);`
  - `CREATE POLICY users_update_authenticated ON public.users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);`
- If app connects with an internal role (e.g., `postgres` via direct `DATABASE_URL`):
  - `CREATE POLICY users_insert_postgres ON public.users FOR INSERT TO postgres WITH CHECK (true);`
  - `CREATE POLICY users_update_postgres ON public.users FOR UPDATE TO postgres USING (true) WITH CHECK (true);`

3) Privileges (if needed):
- `GRANT SELECT, INSERT, UPDATE ON public.users TO <target_role>;`

4) Apply via migration runner:
- Use the prepared `db:migrate:sql` script to run a new migration file with the above statements against the Supabase instance.

## Runtime Stabilization
- Keep `/api/health` exposed and unauthenticated for diagnostics.
- Start dev server on non-conflicting port (e.g., `3001`) to avoid `EADDRINUSE`.
- Keep non-core features disabled via feature flags (e.g., `FEATURE_WHATSAPP=false`).

## Live Registration Test Suite
1) Endpoints to test:
- `POST /api/register` (happy path, duplicate username, duplicate email, invalid inputs)
- `GET /api/auth/csrf`, `POST /api/auth/callback/credentials`, `GET /api/auth/session`
- `GET /api/health`

2) Metrics collection:
- Record status codes and success rates per endpoint.
- Measure response times; compute p50, p90, p95, p99.

3) Data integrity checks:
- Query `users` to validate:
  - Correct record creation
  - Hashed passwords (bcrypt format)
  - Unique constraints (email, username)
  - Field-level validation outcomes

4) Report generation:
- Produce a concise report with:
  - Status codes per endpoint; success/failure counts
  - Latency percentiles per flow (happy path, duplicates, invalid)
  - Data integrity verification results
  - Clear pass/fail indicators per test case
- Use Markdown tables for clarity; add simple ASCII charts for latency distribution.
- Include continuation prompt: "Please confirm to proceed with next steps: [Y/N]"

## Verification & Backward Compatibility
- Verify that registration works without altering API contracts.
- Ensure existing login flows and sessions remain unchanged.
- Confirm no breaking changes to response formats.

## Monitoring & Follow-Up
- Monitor `/api/health` post-implementation.
- Optionally integrate Sentry to capture exceptions across client/server.
- Track performance over time; compare latency distributions pre/post fix.

## Timeline & Resources
- RLS policies & validation: 1–2 days.
- Test suite execution & report: 1 day.
- Monitoring setup (optional Sentry): 1 day.
- Resources: developer with DB access, CI runner or local environment, Supabase Studio.

If you approve, I will implement the RLS policies for the correct role, run the live validation suite with metrics, and deliver the requested report and confirmation prompt.