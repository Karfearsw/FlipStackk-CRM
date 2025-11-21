## Changes
1. Sidebar avatar: show uploaded user avatar if available; fallback to initials. Size 40×40 to match existing avatar. Collapsed brand image also set to 40×40.
2. API: add `/api/user/avatar` to accept an image upload and save it under `public/uploads/user-<id>.jpg`.
3. Settings: add an Avatar section with a file input to upload and refresh the profile.

## Implementation
- Edit `src/components/layout/sidebar.tsx`:
  - Replace initials circle with `<img src="/uploads/user-<id>.jpg">` when load succeeds; fallback to initials on error.
  - Set collapsed header brand image to 40×40.
- Add `src/app/api/user/avatar/route.ts`:
  - `POST`: verify session, read `formData`, write to `public/uploads/user-<id>.jpg`, return URL.
- Edit `src/app/(dashboard)/settings/page.tsx`:
  - New Avatar card with file input, upload mutation, and refresh on success.

## Validation
- Upload an image, see it in the Settings and Sidebar.
- Collapsed header shows brand image at 40×40.

Please approve and I’ll implement and verify locally.