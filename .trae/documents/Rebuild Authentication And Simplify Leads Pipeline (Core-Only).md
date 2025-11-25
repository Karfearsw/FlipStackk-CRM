## Objectives
- Remove non-functional components (e.g., WhatsApp, Discord, realtime messaging, marketing automation) to simplify runtime.
- Rebuild authentication with robust validation, error handling, secure session management, and comprehensive tests.
- Implement a simplified, reliable leads workflow pipeline integrated with auth.
- Document changes and add monitoring to prevent regressions.

## Phase 1: Immediate Cleanup
1. Remove WhatsApp feature entirely (code deletion only; DB drops scheduled later):
   - Delete API routes: `src/app/api/whatsapp/send/route.ts`, `webhook/route.ts`, `templates/route.ts`, `contacts/sync/route.ts`.
   - Delete lib modules: `src/lib/whatsapp/*`.
   - Delete UI: `src/components/whatsapp-panel.tsx` and references in `src/components/communication/communication-hub.tsx`.
   - Remove gating in `src/proxy.ts` and feature flag in `src/lib/features.ts`.
   - Update `public/openapi.json`, docs, and health endpoints.
   - Reference: `/c:/flipstackk-crm/FlipStackk-CRM/.trae/documents/Remove All WhatsApp Code While Keeping Communication, Video, and Calls Stable.md#L9-9`.
2. Remove other broken/unused integrations (if confirmed): Discord, realtime channels/messages, marketing automation, map.
   - Delete corresponding `src/app/api/*` routes, lib code, UI tabs/components, schema/storage code, docs/OpenAPI.
   - Keep Communication (without WhatsApp tab), Video page, Calls feature stable.

## Phase 2: Authentication Redesign
1. Validation (Zod) shared client/server:
   - Define schemas for registration/login: username/email/password rules; role enum.
   - Reuse on client form and server endpoint.
2. Secure session management:
   - NextAuth Credentials provider with JWT sessions (7-day expiry); token rotation.
   - Optional OAuth (deferred) behind env flags.
3. Error handling & logging:
   - Map DB errors to user-friendly messages (schema missing, invalid credentials, connection failures).
   - Structured logger (JSON) and optional Sentry integration.
4. DB policies & stability:
   - Enable RLS and add `INSERT/UPDATE` policies for `public.users` targeted to app runtime role (`authenticated` or the connection role).
   - Use pooled Supabase `DATABASE_URL` (port 6543) for runtime.
5. Testing:
   - Unit tests for validators and auth callbacks.
   - Integration tests for `/api/register`, `/api/auth/callback/credentials`, `/api/auth/session`.
   - E2E smoke tests on `/auth` (Playwright) per preview environment.

## Phase 3: Simplified Leads Pipeline
1. Pipeline design:
   - Minimal stages (New → Qualified → Negotiation → Closed) in `pipeline_stages`.
   - CRUD endpoints remain; ensure auth guards are enforced.
2. Integration with auth:
   - Protect leads/pipeline pages and APIs via middleware and session checks.
   - Role-based access (admin, acquisitions, caller, investor) with simple server checks (RBAC hardening later).
3. Testing:
   - Unit/integration tests for leads/pipeline APIs.
   - E2E: login → create lead → move through stages → close.

## Phase 4: Monitoring & Documentation
1. Monitoring:
   - `/api/health` returns DB status and auth configuration; expose without auth.
   - Add Sentry (optional) for server/client errors; log auth/register failures with context.
2. Documentation:
   - Update deployment guide with pooled DB URL, health endpoint, and migrations.
   - Auth flow documentation (validation, error mapping, sessions).
   - Leads pipeline overview; simplified stage definitions; auth integration.

## Phase 5: Verification & Deliverables
- Fully functional auth (register/login), with clear errors and secure sessions.
- Working leads pipeline (create, update stage, close), protected by auth.
- All broken components removed from runtime (code deleted, DB tables scheduled for drop later).
- Updated technical documentation and test cases for critical paths.
- Monitoring enabled to catch regressions.

## Execution Notes
- Start dev server on non-conflicting port (e.g., `npm start -- -p 3001`).
- Keep DB table drops in a follow-up migration once runtime stability is confirmed.
- Maintain backward compatibility by keeping API contracts unchanged for core features; clearly deprecate removed endpoints.

## Next Step
On your confirmation, I will:
1) Remove WhatsApp and other broken components (code-only),
2) Implement the auth redesign (validation, error handling, sessions),
3) Simplify the leads pipeline and integrate with auth,
4) Run full tests and deliver the concise validation report with metrics and pass/fail indicators.