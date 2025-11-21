# Advanced Feature Walkthroughs

## Real-time Collaboration
- Use internal messaging channels to coordinate while editing documents.
- Enable Discord/WhatsApp mirroring on channels linked to leads if needed.

## Document Versioning
- Create versions via `/api/documents/{id}/versions` with `changeSummary`.
- Compare versions in UI (roadmap); versions are immutable snapshots.

## Assessments and Reporting
- Build assessments with ordered questions.
- Track submissions and pass/fail via `/api/training/submissions`.
- Export progress data from enrollments.

## Video Conferencing Controls
- Set distinct room names per team/module.
- Use Jitsi controls to record (if enabled) and manage participants.