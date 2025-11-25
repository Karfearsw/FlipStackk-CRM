## Scope and Outcomes
- Remove ALL WhatsApp-related code paths (API endpoints, lib, UI, storage, schema, docs, OpenAPI, feature flags).
- Keep Communication section (UI), but without WhatsApp tab/panel and without real-time/messaging integrations.
- Keep Video page and Calls feature intact and stable.
- Preserve core platform stability: auth, leads, deals/pipeline, calls, timesheets, team, analytics, settings, docs.

## Files to Delete (WhatsApp)
- API routes:
  - src/app/api/whatsapp/send/route.ts
  - src/app/api/whatsapp/webhook/route.ts
  - src/app/api/whatsapp/templates/route.ts
  - src/app/api/whatsapp/contacts/sync/route.ts
- Lib:
  - src/lib/whatsapp/client.ts
  - src/lib/whatsapp/setup.ts
  - src/lib/whatsapp/types.ts
  - src/lib/whatsapp/templates.ts
- UI:
  - src/components/whatsapp-panel.tsx

## Files to Edit
- Communication Hub (remove WhatsApp tab/panel imports and rendering):
  - src/components/communication/communication-hub.tsx
    - Remove: import { WhatsAppPanel } ...
    - Remove: <TabsTrigger value="whatsapp" ... /> and <TabsContent value="whatsapp" ... />
- Proxy middleware (remove WhatsApp gates):
  - src/proxy.ts
    - Remove WhatsApp gate: { enabled: FEATURE_WHATSAPP, paths: ['/api/whatsapp', '/whatsapp'] }
- Storage (remove WhatsApp storage class and exports, WhatsApp table helpers):
  - src/lib/storage.ts
    - Remove WhatsAppStorage class, its export, and any methods using whatsapp_* tables
- DB schema (remove WhatsApp tables and types):
  - src/db/schema.ts
    - Remove whatsappConfigs, whatsappContacts, whatsappTemplates, whatsappMessages and relations/types
- Health endpoints (remove feature snapshots for WhatsApp if present):
  - src/app/api/health/route.ts (and any simple/basic variants) – remove feature flags section
- Marketing Automation Engine (remove import/usage of WHATSAPP_QUICK_TEMPLATES):
  - src/lib/marketing-automation/engine.ts – drop any WhatsApp dependencies
- OpenAPI (remove WhatsApp endpoints):
  - public/openapi.json – delete "/api/whatsapp/send", "/api/whatsapp/webhook", "/api/whatsapp/templates", "/api/whatsapp/contacts/sync"
- Documentation (remove WhatsApp references):
  - docs/api.md, docs/system-architecture.md – remove WhatsApp sections

## Environment Cleanup
- Remove WhatsApp env vars from runtime configs and docs:
  - WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID, WHATSAPP_PHONE_NUMBER, WHATSAPP_ACCESS_TOKEN, WHATSAPP_WEBHOOK_VERIFY_TOKEN, WHATSAPP_APP_SECRET
- Feature flags:
  - Remove FEATURE_WHATSAPP from env and from src/lib/features.ts

## Keep and Stabilize
- Keep Video page:
  - src/app/(dashboard)/communication/video/page.tsx – no changes
- Keep Calls feature:
  - src/app/(dashboard)/calls/page.tsx and /api/calls, /api/scheduled-calls – retain as-is
- Keep Communications (general) page sans WhatsApp:
  - src/app/(dashboard)/communication/page.tsx – ensure it renders without WhatsApp tab/panel

## Build and Test Plan
1) Remove files and edit references as listed.
2) Run `npm run build` and address any residual import or type references.
3) Start server on a clean port (`npm start -- -p 3001`).
4) Verify:
   - /communication renders without WhatsApp and without errors
   - /communication/video renders and works
   - Calls pages render; basic CRUD on /api/calls and /api/scheduled-calls work
   - /api/health returns status ok; no WhatsApp warnings
5) Run existing unit/integration tests; ensure no WhatsApp tests remain.

## Backward Compatibility and Rollback
- Remove code only; do not drop DB tables immediately to avoid risky migrations.
- After confirming stability, schedule a follow-up migration to drop WhatsApp tables.
- Rollback plan: retain a branch with WhatsApp code for potential reactivation later.

## Monitoring
- Use /api/health for runtime diagnostics.
- Keep structured logging in place; optionally enable Sentry post-cleanup for server/client errors.

If you approve, I will proceed to remove the WhatsApp code paths, update the communication hub to exclude WhatsApp, and verify build/start with core pages functioning.