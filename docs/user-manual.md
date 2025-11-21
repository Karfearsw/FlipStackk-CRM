# User Manual

## Communication
- Messaging: Use `/communication` to access channels. Create, read, reply, and share files.
- WhatsApp: Send messages via templates, receive inbound webhooks.
- Discord: Participate via mirrored channels when enabled.
- Video: Navigate to `/communication/video`, set a room name, click Join.

## Documentation
- Browse documents: Use `/api/documents` or UI pages when available.
- Create document: POST to `/api/documents` with `title`, `slug`, `content`, `tags`.
- Edit document: PUT `/api/documents/{id}`. Authors and admins can edit.
- Version history: GET `/api/documents/{id}/versions`, POST to create new.
- Comments: GET/POST `/api/documents/{id}/comments` for annotations.
- Search: GET `/api/documents/search?q=...&tag=...`.
- Export: Download Markdown or HTML content and use browser print to PDF.

## Training
- Modules: GET `/api/training/modules` for the catalog.
- Lessons: GET `/api/training/modules/{id}/lessons`.
- Enroll: POST `/api/training/enrollments`.
- Assessments: Create questions, submit answers via `/api/training/submissions`.
- Certifications: Admin issues via `/api/training/certifications`.

## Notifications
- Real-time updates occur for messaging; enable notifications in channel settings.

## Devices
- The UI is responsive and works on desktop/tablet/mobile.