# System Architecture and Technical Specifications

## Overview
FlipStackk CRM now includes a comprehensive communication, documentation, and training system. The stack is Next.js (App Router), TypeScript, Drizzle ORM (PostgreSQL), Supabase Realtime, and integrations with Discord and WhatsApp.

## Core Modules
- Messaging: Internal channels with real-time updates, Discord and WhatsApp mirroring.
- Documentation: Version-controlled documents, comments/annotations, search.
- Training: Modules, lessons, enrollments, assessments, submissions, certifications.
- Video Conferencing: Embedded Jitsi rooms for meetings and training.

## Security
- Authentication: NextAuth credentials provider with JWT sessions.
- RBAC: Role propagated in session; admin-only endpoints for privileged actions.
- Data: Parameterized queries via Drizzle; input validated with drizzle-zod.

## Scalability
- Stateless API routes with pooled PostgreSQL connections.
- Real-time updates via Supabase channels.
- Horizontal scalability on Vercel; database hosted (Neon/Supabase/Vercel PG).

## Storage
- Database: PostgreSQL for entities and audit data.
- Media: Local uploads for avatars; WhatsApp/Discord handle external media.

## Notable Files
- Schema: `src/db/schema.ts`
- Storage services: `src/lib/storage.ts`
- Messaging UI: `src/components/communication/communication-hub.tsx`
- New docs API: `src/app/api/documents/*`
- New training API: `src/app/api/training/*`
- Video page: `src/app/(dashboard)/communication/video/page.tsx`

## Technical Specs
- Database connection: `src/lib/db.ts` using `pg` Pool, SSL on.
- Realtime: `src/lib/supabase.ts` with subscriptions to messaging tables.
- Validation: Zod schemas from Drizzle `createInsertSchema`.