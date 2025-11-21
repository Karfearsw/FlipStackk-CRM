# API Documentation

## Authentication
- All endpoints require an authenticated session via NextAuth.
- Admin-only operations explicitly check `session.user.role === 'admin'`.

## Documents
- `GET /api/documents?q&tag&limit&offset` — List/search documents.
- `POST /api/documents` — Create document.
- `GET /api/documents/{id}` — Get document.
- `PUT /api/documents/{id}` — Update document.
- `DELETE /api/documents/{id}` — Delete (admin).
- `GET /api/documents/{id}/versions` — List versions.
- `POST /api/documents/{id}/versions` — Create version.
- `GET /api/documents/{id}/comments` — List comments.
- `POST /api/documents/{id}/comments` — Create comment.

## Training
- `GET /api/training/modules` — List modules.
- `POST /api/training/modules` — Create module.
- `PUT /api/training/modules/{id}` — Update module.
- `GET /api/training/modules/{id}/lessons` — List lessons.
- `POST /api/training/modules/{id}/lessons` — Create lesson.
- `POST /api/training/assessments` — Create assessment.
- `GET /api/training/assessments/{id}/questions` — List questions.
- `POST /api/training/assessments/{id}/questions` — Create question.
- `POST /api/training/enrollments` — Enroll current user.
- `PUT /api/training/enrollments` — Update enrollment progress/status.
- `POST /api/training/submissions` — Submit assessment.
- `POST /api/training/certifications` — Issue certification (admin).

## Messaging (existing)
- Channels/messages/read receipts endpoints under `/api/channels` and `/api/messages`.
- WhatsApp: `/api/whatsapp/*` send, webhook, templates, contacts.
- Discord: `/api/discord/*` interactions, webhook, setup.