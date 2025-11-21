# Administrator Guide

## Roles and Access
- Roles: `admin`, `acquisitions`, `caller`, `investor`.
- Admin-only: Certification issuance, destructive document operations.

## Configuration
- Environment: `DATABASE_URL`, Supabase keys for realtime, Discord/WhatsApp secrets.
- Webhooks: Configure Discord and WhatsApp in their respective setup APIs.

## Data Management
- Documents: Maintain slugs unique, publish via `isPublished`.
- Training: Create modules/lessons, assessments, manage enrollments and progress.
- Certifications: Issue via `/api/training/certifications` with optional `expiresAt`.

## Auditing
- Communications logged in `communications` table.
- Activities in `activities` table for core actions.

## Scaling
- Prefer hosted Postgres and monitoring; adjust pool settings in `src/lib/db.ts`.