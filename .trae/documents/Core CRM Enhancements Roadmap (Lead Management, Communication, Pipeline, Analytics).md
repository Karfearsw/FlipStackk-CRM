## Objectives
- Deliver high‑priority features: Enhanced Lead Management, Communication Hub, Sales Pipeline, Revenue Analytics.
- Keep architecture consistent with Next.js App Router, TypeScript, Drizzle ORM, TanStack Query, NextAuth, Tailwind, shadcn/ui.
- Maintain existing patterns: centralized storage (`src/lib/storage.ts`), activity logging, query keys, and API route conventions under `src/app/api/*`.

## Phase 1: Enhanced Lead Management
1) Data Model (Drizzle)
- Extend `leads` with: `score` (int), `priority` (enum: low/med/high), `source` (text), `status` hardening (enum stages), `lastContactAt` (timestamp), `duplicateOfLeadId` (nullable FK).
- New tables:
  - `lead_assignments`: id, leadId, assignedToUserId, assignedByUserId, status (assigned/accepted/rejected), notes, createdAt/updatedAt.
  - `lead_status_transitions`: id, leadId, fromStatus, toStatus, changedByUserId, reason, createdAt.
  - `lead_sources`: id, name, cost, createdAt (optional for source ROI tracking) — or keep `source` inline and track ROI via `activities`.
  - `duplicate_candidates`: id, leadId, candidateLeadId, similarityScore, resolved (bool), createdAt.

2) API Endpoints (App Router)
- `POST /api/leads/:id/assign` → create assignment, notify assignee.
- `POST /api/leads/:id/assign/accept` | `/reject` → update assignment state.
- `POST /api/leads/:id/status` → enforce transitions via whitelist rules; write to `lead_status_transitions` and `activities`.
- `GET /api/leads/duplicates` → list suspected duplicates; `POST /api/leads/:id/duplicates/resolve`.
- `GET /api/leads/export` (CSV) | `POST /api/leads/import` (CSV with validation).

3) UI/UX
- Leads page enhancements (`src/app/(dashboard)/leads/page.tsx`): scoring badge, priority chips, assignment dropdown, bulk assign, duplicate banner.
- Lead dialog: status change with allowed transitions, assignment notes, source selector.
- Import/export modal with drag‑and‑drop CSV, error preview.
- Activity logging remains consistent using `storage.createActivity`.

4) Scoring & Duplicates
- Scoring formula: ARV, repair cost, motivation level, property type, recent activity. Expose `POST /api/leads/:id/recompute-score` and nightly recompute job.
- Duplicate detection: canonical keys (normalized `address+ownerPhone/email`), plus fuzzy similarity. Prefer Postgres deterministic checks (unique constraints on normalized fields); add heuristic matches recorded in `duplicate_candidates`.

## Phase 2: Communication Hub
1) Data Model
- `communications`: id, leadId, type (call/email/sms), direction (inbound/outbound), subject (nullable), body, to, from, status (sent/failed/delivered), providerMessageId, createdByUserId, createdAt.
- `templates`: id, type (email/sms), name, subject (nullable), body, createdByUserId, createdAt.

2) Integrations
- SMS: use existing `twilio` dependency (provider keys via env), implement server‑side send and status webhook.
- Email: choose provider
  - Option A: Resend (serverless‑friendly, simple). Install when approved; add envs.
  - Option B: Nodemailer with SMTP (no vendor lock‑in). Requires SMTP creds.

3) API Endpoints
- `POST /api/communications/send` → send email/SMS based on `type`, persist record, log activity.
- `GET /api/communications?leadId=...` → unified history timeline.
- `POST /api/templates` | `GET /api/templates` | `PUT /api/templates/:id` | `DELETE /api/templates/:id`.
- `POST /api/webhooks/twilio` | `POST /api/webhooks/email-provider` to update delivery status.

4) UI/UX
- New `/communications` page: inbox‑like list, filters, quick compose.
- Lead detail timeline: show calls (existing), plus emails/SMS from `communications`.
- Template manager: create/edit with variables (e.g., `{{lead.name}}`, `{{property.address}}`).

## Phase 3: Sales Pipeline
1) Data Model
- `opportunities`: id, leadId, title, value, stage (prospect/negotiation/contract/closing/won/lost), probability, expectedCloseDate, ownerUserId, createdAt/updatedAt.
- `contracts` (optional now): id, opportunityId, fileUrl, signedAt, status.
- `commissions`: id, opportunityId, userId, percent, amount, createdAt.

2) API
- `GET/POST /api/opportunities`, `GET/PUT/DELETE /api/opportunities/:id`.
- `POST /api/opportunities/:id/stage` for drag‑and‑drop updates; logs activity and recalculates forecasting.

3) UI/UX
- New `/pipeline` page: Kanban with columns per stage, DnD to update stage, totals per column, quick add.
- Lead detail: link existing lead to opportunity or create from lead.

## Phase 4: Revenue Analytics
1) Data Model
- Use `opportunities` + `commissions` as primary source of revenue; optional `payments` table: id, opportunityId, amount, type (income/expense), date, notes.

2) Aggregations API
- `GET /api/analytics/revenue` (MTD/QTD/YTD totals, trends).
- `GET /api/analytics/conversion` (funnel: leads → opportunities → won).
- `GET /api/analytics/team` (per‑user calls, conversions, revenue).

3) UI/UX
- Enhance `/analytics` with charts. Library options:
  - Option A: Recharts (simple, commonly used).
  - Option B: Nivo (rich visuals). Evaluate bundle impact.
- Keep `useApiQuery` pattern and cache keys consistent.

## Cross‑Cutting Concerns
- Permissions: extend role checks with granular guards per endpoint and UI actions; optional `permissions` table or static policy mapping.
- Notifications: assignment email/SMS, follow‑up reminders. Use cron (Vercel Cron or `node-cron`) for scheduled tasks.
- Audit: continue using `activities`; add typed `actionType` values for new entities.
- Storage: keep local `public/uploads` for avatars; postpone documents storage to Medium Priority (S3/Cloudinary) after approvals.

## Implementation Order & Milestones
- Milestone 1 (Lead Management)
  - Migrations for new lead fields and tables
  - Assignment & status endpoints
  - UI updates on `/leads`
  - CSV import/export
- Milestone 2 (Communication Hub)
  - Twilio SMS send + webhook
  - Email provider selection and send flow
  - Unified communications timeline
  - Templates CRUD
- Milestone 3 (Pipeline)
  - `opportunities` CRUD + Kanban UI
  - Stage update endpoint + forecasting
- Milestone 4 (Analytics)
  - Aggregation endpoints
  - Charts on `/analytics`

## Testing & Verification
- Add lightweight test harness (later): API integration tests for new routes; schema validation tests.
- Manual verification via seeded data where applicable; preserve existing TanStack Query patterns and `invalidateQueries` usage.

## Risks & Mitigations
- Duplicate detection accuracy: combine deterministic keys + heuristic candidates; allow manual resolution.
- Email provider choice: decide based on deployment constraints; abstract provider behind a thin service layer.
- Performance: index new FK and lookup columns; paginate communications and activities.

## Acceptance Criteria
- Lead assignment flow with notifications and acceptance/rejection works end‑to‑end.
- Status transitions enforced and logged.
- Unified communications timeline visible per lead; templates send email/SMS.
- Kanban pipeline supports DnD, stage updates, and forecasting.
- Analytics page shows revenue/conversion/team metrics with charts.

## Next Step (on approval)
- Proceed with Phase 1 migrations and API endpoints, following repository conventions, then UI updates on `/leads` and activity logging.