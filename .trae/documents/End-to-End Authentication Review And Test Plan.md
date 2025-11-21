## Scope
- Perform a full audit and end-to-end testing of authentication: login/logout, sessions/JWT, RBAC, password recovery, Supabase connectivity, error handling, and security.
- Identify gaps vs. requested features (e.g., password recovery, Supabase Auth APIs) and propose fixes.

## Architecture Observations (from code audit)
- Auth: NextAuth Credentials provider with JWT sessions (`src/app/api/auth/[...nextauth]/route.ts`).
- Middleware: Auth-only gate; no role checks (`src/middleware.ts`).
- DB: Drizzle ORM on Supabase Postgres via `@vercel/postgres` (`src/lib/db.ts`).
- Registration: Custom `POST /api/register` with Zod validation and bcrypt hashing.
- Password recovery: Not implemented; UI shows a “Forgot your password?” link but no flow.
- Supabase Auth: Not used; only Supabase Postgres pool via `DATABASE_URL`.

## Test Plan
### 1) Authentication Flow
- Login success: valid admin → redirected to `/dashboard`.
- Login failure: wrong password → toast + 401 from NextAuth.
- Logout: session cleared; accessing protected page returns to `/auth`.
- Session/JWT: verify `session.user.id/username/role` populated; token maxAge 7 days; tamper token → invalid session.
- RBAC: Attempt restricted actions with different roles; confirm enforcement (current gap: no role enforcement in middleware/routes → document and propose fix).

### 2) Password Recovery System (gap)
- Confirm missing routes/UI/backend.
- Proposed implementation to test: 
  - `POST /api/password/forgot` → issue short-lived reset token stored in DB; send email.
  - `POST /api/password/reset` → verify token, hash new password, invalidate token.
  - Add UI pages `/auth/forgot` and `/auth/reset`.
- Test cases: email dispatch, token expiry, one-time use, password updated.

### 3) Supabase Integration
- Connectivity: validate DB queries for `users`, `leads`, etc. under normal load.
- Supabase Auth APIs: not present; confirm the app doesn’t rely on them. If required, define migration path to Supabase Auth (or stay on NextAuth).
- Stability: simulate intermittent network (retry strategy absence → document) and observe API resilience.

### 4) Error Handling
- Verify consistent error messages on auth/register/login.
- Check logs: capture API errors; note `console.*` usage and recommend structured logging.
- Edge cases: expired session, invalid JWT, missing env secrets; document responses.

### 5) Security
- Password hashing: `bcryptjs` with salt rounds 10; verify hashes not in logs.
- HTTPS: verify on Vercel; local dev runs HTTP.
- CSRF: NextAuth protects `/api/auth/*`; custom `POST /api/register` lacks CSRF → document and propose CSRF or rate limiting.
- XSS: Review UI inputs/outputs; propose CSP and output encoding where needed.
- Rate limiting: Document absence; propose limits on login/register.

## Execution Steps
1. Run test matrix on the current Preview/Local build: login/logout, session, protected routes, error scenarios.
2. Document observed behaviors with route/file references and screenshots/log excerpts.
3. Identify and prioritize fixes (RBAC enforcement, password recovery, logging, security headers, rate limiting).
4. Implement fixes and re-run tests; provide pass/fail report.

## Deliverables
- Auth Test Report: test cases, steps, expected vs. actual, results, issues found, resolutions.
- Change list and code diffs for fixes (pending your approval).
- Recommendations for production hardening and monitoring.

## Next Actions (upon approval)
- Execute tests against your current environment, compile a report, and propose targeted patches for the identified gaps (RBAC, password recovery, security headers, rate limiting, structured logging).