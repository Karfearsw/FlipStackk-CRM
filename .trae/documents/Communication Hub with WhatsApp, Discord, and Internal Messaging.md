## Objectives
- Build a modular communication hub that unifies WhatsApp, Discord, and internal messaging.
- Provide real-time messaging, synchronization, role-based access, audit logging, and secure handling of content.
- Deliver open-source quality docs, APIs, and contribution standards.

## Architecture Overview
- **Core App**: Next.js App Router + TypeScript, Drizzle ORM on Postgres, NextAuth for auth, Tailwind + shadcn/ui.
- **Realtime**: Supabase Realtime channels for live updates (no extra infra dependencies), with fallback to web push notifications.
- **Integration Layer**: Pluggable provider interfaces (`WhatsAppProvider`, `DiscordProvider`) behind a common `MessageBridge` service.
- **Event Bus**: Internal async dispatcher for inbound/outbound events (`message.created`, `message.delivered`, `message.read`) to fan out to integrations and UI.
- **Storage**: Postgres tables for users, profiles, contacts, channels, participants, messages, message_status, attachments, integrations, provider_id_maps.
- **Security**: Secrets via env, HMAC verification for webhooks, per-channel RBAC, audit trail in `activities`, optional end-to-end encryption for internal chats.

## Data Model (Drizzle/Postgres)
- **users**: existing (role, profile, avatar).
- **contacts**: id, userId (owner), displayName, phone/email, provider, externalId, metadata.
- **channels**: id, type (direct/group/integration), provider (internal/whatsapp/discord), name, topic, createdBy.
- **channel_participants**: channelId, userId or contactId, role (owner/mod/member), permissions.
- **messages**: id, channelId, author (userId/contactId), body, contentType (text/file/media), encrypted (bool), createdAt.
- **message_status**: messageId, userId, status (delivered/read), timestamp.
- **attachments**: id, messageId, url, mimeType, size, thumbnailUrl.
- **integrations**: id, type (whatsapp/discord), config (json), active.
- **provider_id_maps**: localMessageId ↔ externalMessageId, localChannelId ↔ externalChannelId.
- **activities**: extend existing for messaging actions (send, receive, read, sync).

## Integration: WhatsApp
- **Provider Choice**: Support Meta WhatsApp Cloud API and Twilio WhatsApp via adapter pattern.
- **Inbound**: Webhook endpoint verifies signature (HMAC or provider method), normalize payload → `messages` and `provider_id_maps`, trigger event bus.
- **Outbound**: Send via provider, record status updates, mirror into internal channel.
- **Contacts & Groups**: Sync contacts; group chats map to `channels` of type group with participants from provider.
- **E2E Considerations**: WhatsApp Business/Cloud APIs are not end-to-end to the business; enforce TLS in transit, encrypt at rest (optional per-channel). Internal messaging supports optional E2E using client-side crypto.
- **Policies**: Respect rate limits, message templates for notifications, opt-in/opt-out compliance.

## Integration: Discord
- **Bot & Webhook**: Bot with privileged intents (message content, guild members) for mirroring; webhook for simple outbound posts.
- **Channel Mirroring**: Map Discord channels ↔ internal channels; synchronize messages both ways with `provider_id_maps` to avoid loops.
- **RBAC**: Pull Discord roles, map to internal role sets; gate mirroring and commands based on roles.
- **Bot Commands**: `/route`, `/link`, `/mute` to control routing and subscriptions; rate-limit and audit.

## Internal Messaging Hub
- **Auth & Profiles**: NextAuth with existing users; profile fields (display name, presence); avatar uploads (existing implementation).
- **Realtime Messaging**: Supabase channels per internal channel; optimistic send, server ack, status updates.
- **Read Receipts**: Write `message_status` events on client read; display per-message read indicators.
- **Files/Media**: Upload to Supabase Storage (or local), scan mime/type, size limits; thumbnails for images/video.
- **Search**: Full-text search on `messages.body` (Postgres `tsvector` with language), filters by user/channel/date/contentType.
- **Notifications**: Browser push (Web Push, VAPID), email/SMS optional via providers; per-user notification preferences.
- **Encryption (Optional)**: Per-channel E2E using WebCrypto/libsodium; store encrypted payload + nonces; key exchange via user public keys; server stores only ciphertext.

## APIs (App Router)
- **Messaging**: `GET/POST /api/channels`, `GET/POST /api/messages`, `GET /api/messages/search`, `POST /api/messages/read`, `POST /api/attachments`.
- **Contacts**: `GET/POST /api/contacts`, `POST /api/contacts/link` (link to provider contact).
- **Integrations**: `GET/POST /api/integrations`, `POST /api/integrations/discord/send`, `POST /api/integrations/whatsapp/send`.
- **Webhooks**: `/api/webhooks/whatsapp`, `/api/webhooks/discord` with signature validation.
- **Admin**: `GET /api/admin/roles`, `POST /api/admin/channels/:id/permissions`.
- **Docs**: OpenAPI spec generated from handlers for third-party integration.

## UI/UX
- **Communication Hub** page: unified inbox with filters (platform, channel, participants), pinned threads, unread counts.
- **Channel View**: message list, composer (text/files), reactions, read receipts, delivery status, encryption badges.
- **Contacts**: provider-linked contacts with presence and quick actions.
- **Settings**: integrations config (tokens, webhook URLs), notification preferences, encryption settings.

## Security & Compliance
- Secrets in env, never logged; role checks on all endpoints and mirroring operations.
- HMAC verification for inbound webhooks; strict JSON schema validation (zod) for all inputs.
- Rate limiting per user and provider endpoint; content sanitation (XSS-safe rendering).
- Audit logging in `activities`; privacy options (redact or encrypt message bodies at rest).
- Respect WhatsApp/Discord API terms and rate limits; template approval for WhatsApp notifications.

## Scaling Strategy
- Stateless API handlers; Supabase Realtime scales with channels.
- Postgres indexes on `messages (channelId, createdAt)`, `message_status (messageId,userId)`, FTS GIN index.
- Background workers (serverless scheduled jobs) to retry provider sends and reconcile statuses.
- Sharding via channel partitions if needed; CDN for attachments.

## Open-Source Deliverables
- **Documentation**: Installation, configuration (env vars for providers), deployment guides.
- **Modularity**: Provider adapters with clear interfaces; plug-in registry.
- **API Docs**: OpenAPI/Swagger UI; examples for sending/listing messages.
- **Contribution**: Code style, PR process, issue templates, maintainers guide.
- **License**: MIT or Apache-2.0; third-party SDK licenses documented.

## Milestones
- **Phase 1**: Internal messaging (channels, messages, realtime, read receipts, attachments, search, notifications). API + UI.
- **Phase 2**: Discord integration (webhook outbound, bot inbound, channel mirroring, RBAC mapping, commands).
- **Phase 3**: WhatsApp integration (provider adapter, inbound webhook, outbound send, contact/group sync, compliance guardrails).
- **Phase 4**: Encryption options, OpenAPI docs, contribution guidelines, scaling checks and load tests.

## Configuration (Env)
- `DISCORD_BOT_TOKEN`, `DISCORD_WEBHOOK_URL`, `DISCORD_CLIENT_ID/SECRET`
- `WHATSAPP_TOKEN` (Cloud API) or `TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM`
- `SUPABASE_URL/KEY`, `NEXTAUTH_SECRET`, `DATABASE_URL`
- `WEB_PUSH_PUBLIC_KEY/PRIVATE_KEY`

## Acceptance Criteria
- Unified hub shows real-time messages across internal, Discord, and WhatsApp with consistent delivery/read states.
- Role-based access prevents unauthorized mirroring; audit logs capture actions.
- APIs documented and tested; provider rate limits respected; secure handling of secrets.
- Deployable for small teams and large orgs with clear configuration and scaling guidance.