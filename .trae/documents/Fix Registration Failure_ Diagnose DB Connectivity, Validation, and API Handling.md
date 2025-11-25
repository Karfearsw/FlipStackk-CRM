## Observed Error
- UI toast shows `Failed to create user` on `/auth` register form submission.
- This message is returned by `/api/register` when a non-duplicate, non-validation error occurs.

## Likely Root Causes
- Database connectivity: `DATABASE_URL` missing/invalid; direct connection using `pg` in `src/lib/db.ts` requires a valid Supabase connection string.
- Schema not applied: `users` table missing; inserts fail (error code `42P01`).
- Constraint failures not mapped: unique violations handled (23505) but other DB errors fall back to generic 500.

## Diagnostic Steps (No Code Changes)
1) Call `GET /api/health` to inspect DB health; capture `details.database.message` if status is `error`.
2) Confirm `DATABASE_URL` in local and Vercel:
   - Local: `.env.local` must contain Supabase pooled URL (port 6543) with SSL.
   - Vercel: set pooled `DATABASE_URL` in project settings.
3) Verify schema presence:
   - Run `npm run db:push` locally to apply Drizzle schema to Supabase.
   - Confirm `users` table exists in Supabase Table Editor.

## Fix Plan (Code + Config)
1) Configuration:
- Set `DATABASE_URL` to Supabase pooled connection string: `postgresql://postgres:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`.
- Keep `ssl: { rejectUnauthorized: false }` as in `src/lib/db.ts`.

2) API Enhancements (Specific Errors):
- Extend `/api/register` to map and return specific messages for common errors:
  - `42P01`: Table not found → “Database schema not initialized”.
  - `28P01`: Auth failed → “Database credentials invalid”.
  - `08001`/`ETIMEDOUT`: Connection → “Database connection failed”.
  - Fallback retains 500 but logs full details.

3) Validation and Submission Logic:
- Client: already validates fields via zod; ensure role values are lowercase (UI sends `admin`, `caller`, etc.).
- Server: `insertUserSchema.parse` is correct and hashes password.

4) Testing Scenarios
- Happy path: unique username/email, valid password; expect 201.
- Duplicate username/email: expect 400/409 specific messages.
- Invalid inputs: short username/password, invalid email; expect 400.
- DB offline/invalid URL: expect 503/500 with clear error.

5) Documentation
- Add section to deployment docs: required envs (`DATABASE_URL`, `NEXTAUTH_*`), pooled vs direct connection, schema migration steps.
- Document error code mappings and troubleshooting.

## Outcome
- Clear, user-friendly errors with root cause hints instead of generic 500.
- Stable registration under valid configuration with preserved data integrity (bcrypt hashing, unique constraints).

On approval, I will implement the error mapping in `/api/register`, verify `DATABASE_URL` configuration, run schema migrations, and test the scenarios end-to-end to confirm resolution.