## Steps
- Ensure preview env vars exist in Vercel: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
- If Vercel CLI is authenticated:
  - Run `npm run build` (already successful).
  - Deploy preview: `vercel --yes` to upload current workspace and create a preview URL.
- If CLI not authenticated:
  - Use Vercel Dashboard: Import this project, map preview env vars, and click Deploy to get the preview URL.

## Verification On Preview
- Visit the preview URL.
- Unauthenticated should redirect to `/auth`.
- Log in with admin; confirm session values via `GET /api/user`.
- Read endpoints respond: `GET /api/leads`, `GET /api/team`, `GET /api/activities`.

## Notes
- Middleware deprecation warning is non-blocking.
- Registration uses `/api/register` and now bypasses middleware appropriately.

On approval, I will attempt the CLI deployment; if authentication is required, I will provide the exact dashboard steps to complete the preview and then validate the URL end-to-end.