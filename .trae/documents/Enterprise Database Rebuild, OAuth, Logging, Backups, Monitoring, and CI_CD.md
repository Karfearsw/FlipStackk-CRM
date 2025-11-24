## Overview
We will rebuild the database on Supabase with a clean, scalable schema, integrate LinkedIn and Facebook OAuth using NextAuth, add comprehensive logging, backups and performance monitoring, and set up a robust dev → CI/CD → production workflow. We will start on Supabase free tier but design for growth.

## Phase 1: Requirements, Inventory, and Architecture
1. Inventory current entities and flows (users, roles, leads, deals, messages, marketing automation) and note gaps.
2. Decide tenancy model (single-tenant vs future multi-tenant) and data retention policies.
3. Define security boundaries and access patterns (service APIs, background workers, dashboards).

## Phase 2: Database Schema (Supabase / Postgres)
1. Core tables:
   - `users` (id, email, username, name, auth_provider, provider_account_id, role, status, password_hash nullable, created_at, updated_at)
   - `roles` and `permissions` with `role_permissions` junction
   - Domain entities: `leads`, `deals`, `channels`, `messages`, `notifications`, `activities`, `timesheets`, `documents`, `marketing_campaigns`, `workflow_runs`
   - `audit_logs` (who, action, entity, entity_id, diff, ts)
2. Constraints and indexes:
   - Unique: email, username, provider_account composite
   - Foreign keys with ON DELETE/UPDATE policies
   - Indexes for frequent queries; partial indexes where useful
3. Row Level Security (RLS):
   - Enable RLS on all tables
   - Policies for role-based access (admin full, staff scoped, investor limited)
4. Migrations:
   - Implement with Drizzle (matching existing stack)
   - Generate initial full-schema migration and seed scripts (admin user, baseline roles)
5. Data lifecycle:
   - Soft-deletes via `deleted_at`
   - Archival strategy for large tables (e.g., messages) using partitions

## Phase 3: Authentication (NextAuth + OAuth)
1. NextAuth providers:
   - Add LinkedIn and Facebook providers in `src/app/api/auth/[...nextauth]/route.ts` alongside Credentials.
   - Env vars: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.
   - Callback URLs: `https://<domain>/api/auth/callback/linkedin` and `/callback/facebook`.
2. Account linking:
   - On first OAuth sign-in, create or link user record by email; store `provider` and `provider_account_id`.
   - Support merging with existing credentials user if emails match.
3. Session strategy:
   - Continue JWT sessions with 7-day expiry; embed role/username and minimal profile in token.
   - Implement token rotation and `sessionToken` cookie hardening.
4. Security:
   - Enforce HTTPS, secure cookies, CSRF (NextAuth handles), rate limit auth endpoints.

## Phase 4: Logging and Observability
1. Application logging:
   - Add structured logger (e.g., pino) with request IDs; sanitize PII.
   - Log key events (auth, errors, important CRUD) to `audit_logs` table.
2. Error tracking:
   - Integrate Sentry for server and client errors.
3. Performance metrics:
   - Web Vitals and Vercel Analytics for frontend.
   - Database monitoring using `pg_stat_statements`; slow query thresholds with logs.
4. Realtime monitoring dashboard:
   - Minimal admin dashboard showing auth success/failures, error rates, and query timings.

## Phase 5: Backups and Recovery
1. Supabase backups:
   - Use built-in daily backups (free tier). Document restore procedures.
2. Logical backups:
   - Nightly `pg_dump` of critical tables to Supabase Storage; retain 7–30 days.
3. Disaster recovery:
   - Define RPO/RTO, test restore to a staging project quarterly.

## Phase 6: Development Environment
1. `.env.local` with Supabase pooled `DATABASE_URL` and all provider secrets.
2. Local dev uses free-tier Supabase project; optionally set up Supabase CLI for local Postgres later.
3. Seed scripts to create admin and sample data.
4. Run migrations and seeds via npm scripts.

## Phase 7: Testing Strategy
1. Unit tests (Vitest) for services, validators, and auth callbacks.
2. Integration tests for API routes (registration, login, role access, audit logging).
3. E2E tests (Playwright) for `/auth` flows: credentials, LinkedIn, Facebook; dashboard access; logout; password recovery.
4. Cross-browser coverage: Chromium, Firefox, WebKit.
5. Performance tests: measure auth latency and selected DB queries.

## Phase 8: CI/CD Pipeline
1. GitHub Actions:
   - Jobs: install, lint, typecheck, unit/integration tests; optional E2E with Playwright on ephemeral deployments.
   - Build and run Drizzle migrations against staging Supabase using environment secrets.
2. Vercel integration:
   - Preview deployments per PR; protect production branch.
   - Environment variables per environment (dev/staging/prod) including `NEXTAUTH_URL` and `DATABASE_URL`.
3. Gates:
   - Require all tests green; require migration success on staging before production deploy.

## Phase 9: Security Best Practices
1. Secrets management via Vercel/GitHub; `.env.local` ignored.
2. RLS + least-privileged policies; parameterized queries (Drizzle).
3. Input validation (zod) end-to-end; sanitize outputs.
4. Rate limiting for auth and registration endpoints.
5. Secure headers; CSP and sameSite cookies.

## Phase 10: Documentation
1. Architecture overview: schema, auth flows, RLS policies, logging.
2. Runbook: migrations, backup/restore, rotating secrets, incident response.
3. Developer guide: local setup, testing, CI/CD, envs.
4. Playbooks for OAuth setup on LinkedIn and Facebook (app registration, callback URLs, scopes).

## Deliverables and Success Criteria
- Fully functional local env with migrations, seeds, OAuth, logging, backups, monitoring.
- CI/CD with gated deploys; preview environments; documented environment variables.
- Production-ready deployment to Vercel; Supabase free-tier and scalable schema.
- Comprehensive tests: unit, integration, E2E, cross-browser; performance targets captured.

## Implementation Order
1) Schema design + RLS → 2) Migrations + seeds → 3) OAuth providers → 4) Logging + audit → 5) Backups setup → 6) Monitoring → 7) Tests → 8) CI/CD → 9) Documentation → 10) Production deploy.

Please confirm this plan. On approval, I will implement step-by-step and verify each stage with tests and live checks before proceeding to production.