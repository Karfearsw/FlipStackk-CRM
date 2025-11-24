## Objectives
- Deliver a stable, core-only version of FlipStackk focused on lead and deal management, pipeline, dashboard, and authentication.
- Remove or feature-flag experimental, complex, or unproven integrations to reduce risk and external dependency load.

## Core Features To Keep
- Authentication and sessions (NextAuth credentials; OAuth gated behind flag)
- Users/roles and basic team pages
- Leads, deals, pipeline stages, activities, timesheets
- Dashboard basics (stats cards, tables)
- Documents minimal (view/edit) if used in core workflows

## Candidates To Remove or Gate
- WhatsApp integration: `src/lib/whatsapp/*`, API routes under `src/app/api/whatsapp/*`
- Discord integration: `src/lib/discord/*`, API routes under `src/app/api/discord/*`
- Realtime messaging and channels: `src/hooks/use-realtime-messaging.ts`, Supabase realtime in `src/lib/supabase.ts`, channels/messages API routes
- Marketing automation engine: `src/lib/marketing-automation/*`, UI pages `(dashboard)/marketing-automation/*`
- Video communication: `(dashboard)/communication/video`
- Map features (Leaflet): `(dashboard)/map` and `react-leaflet`
- E2E Playwright (keep in CI but excluded from app build; optional for stable tag)
- OAuth providers (LinkedIn/Facebook) can be disabled via env flag for stable core

## Stabilization Steps
1. Implement feature flags and default them OFF for non-core modules
- Add config (env) flags: `FEATURE_WHATSAPP`, `FEATURE_DISCORD`, `FEATURE_MARKETING_AUTOMATION`, `FEATURE_REALTIME`, `FEATURE_VIDEO`, `FEATURE_MAP`, `FEATURE_OAUTH`
- Wrap route handlers and pages behind flag checks; return 404 or redirect when disabled

2. Remove or defer heavy dependencies
- Condition imports/use to avoid bundling large libs (Leaflet, Discord, Twilio, Supabase realtime)
- Adjust `tsconfig`/build to exclude e2e from app bundle (already configured)

3. Simplify API surface
- Keep only core routes: leads, deals, pipeline, activities, timesheets, auth, user
- Disable non-core endpoints by gating (refs under `src/app/api/*`)

4. Tests And Coverage
- Ensure unit/integration tests pass with non-core modules disabled
- Add smoke tests for core flows: registration → login → create lead → create deal → move pipeline → timesheet entry
- Enforce coverage threshold for core services

5. Documentation
- Update `docs/system-architecture.md` and `PRODUCTION_SETUP.md` with core-only setup
- Add feature-flag matrix describing defaults and how to enable

6. Release And Tagging
- Create `stable` branch or tag to track minimal build
- CI: run unit/integration tests; skip e2e for stable tag unless preview provided
- Vercel: deploy from `main` with flags OFF; preview for flag-ON builds if needed

## Implementation Outline
- Add feature flag resolver utility and env defaults
- Gate imports/pages/routes for non-core features
- Update tests to skip gated areas and increase core coverage
- Prune optional deps from production bundle via flags
- Update docs and CI to reflect stable mode

## Verification
- Build passes with flags OFF
- Unit/integration tests green with coverage on core modules
- Manual smoke test on Vercel preview
- No missing env warnings for disabled modules

## Rollback
- Flags are reversible; re-enable features by toggling envs
- Keep removed modules in code behind flags to simplify future reactivation

If approved, I will implement feature flags, gate non-core modules, adjust routes/pages, update tests and documentation, and deliver a `stable` build with verified coverage and deployment.