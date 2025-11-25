## Preconditions
- Ensure admin `DATABASE_URL` for Supabase is available (direct URL on port 5432) and app `DATABASE_URL` uses pooled URL (port 6543) for runtime.
- Stop any local server occupying port 3000 (Terminal#1015‑1029 shows EADDRINUSE) or start on a different port to run endpoint checks.

## Migration Execution
1) Schema snapshot (before):
- Export current schema: `pg_dump --schema-only` (or use information_schema queries).
- Record table/column definitions, constraints, indexes.

2) Apply SQL migration:
- Run `supabase/migrations/20251123_rls_audit.sql` via psql against the Supabase instance.

3) Drizzle schema sync:
- Set pooled `DATABASE_URL` locally and run `npm run db:push` to align application schema.

4) Schema snapshot (after):
- Export schema again and diff against pre‑migration snapshot.

## Verification & Report Generation
### 1. Schema Differences Analysis
- Compare tables, columns, constraints, indexes:
  - Note added audit_logs and triggers on core tables
  - Confirm RLS enabled on target tables
  - Highlight any breaking changes (e.g., new NOT NULLs, enum changes)

### 2. Endpoint Testing Results
- Test core endpoints post‑migration:
  - `GET /api/health`: expect 200 and `status: ok`
  - `POST /api/register`: expect 201; duplicates → 400/409; invalid input → 400; DB issues → mapped 503
  - `POST /api/auth/callback/credentials`: expect 200/redirect to sign‑in on failure; session fetch returns user on success
  - Key domain endpoints (`/api/leads`, `/api/deals`, `/api/pipeline-stages`): expect 200 with valid payloads
- Record status codes and response times (measure with curl or fetch timings).
- Identify any endpoints impacted by schema changes.

### 3. Data Integrity Verification
- Record counts per key table before/after (users, leads, deals, pipeline_stages).
- Validate foreign key relationships (e.g., leads.assigned_to_user_id references users.id).
- Sample data validation: create and read sample rows across key tables, confirm constraints and indexes.

### 4. Client‑Side Impact Assessment
- Document required frontend modifications (if any):
  - Confirm `users.password` may be null for OAuth; UI remains unchanged for credentials flow
  - No response format changes expected for core endpoints
  - Note any deprecated endpoints (gated features disabled produce 404)
- Address build warnings (Terminal#897‑911):
  - WhatsApp envs missing; either configure envs or keep feature flags disabled for stable mode to suppress warnings.

## Deliverables
- Concise report including:
  - Schema diff summary with breaking changes
  - Endpoint test table (endpoint, method, status, latency)
  - Data integrity checks and sample validations
  - Client‑side impact and recommended changes

## Execution Notes
- Use pooled `DATABASE_URL` everywhere in runtime to reduce login/registration errors and connection issues.
- Keep `/api/health` publicly accessible for diagnostics (already excluded from auth).
- If Vercel deploy uses `npm ci`, ensure lockfile is synced; otherwise use `npm install --legacy-peer-deps` in `vercel.json`.

On approval, I will run the migration, perform the verification steps, and deliver the report with measurements and findings.