## Environment Configuration
- In Vercel Project Settings → Environment Variables (Preview):
  - `DATABASE_URL` = your provided Postgres URL
  - `NEXTAUTH_URL` = the preview deployment URL Vercel gives (e.g., `https://<preview>.vercel.app`)
  - `NEXTAUTH_SECRET` = your provided 32‑byte secret
- Confirm `vercel.json` secret mappings are aligned with Preview scope (`vercel.json`:4–8).
- No local `.env` required; we will avoid running a local server.

## Build Check (Safe)
- Run a local compile check only: `npm run build` to catch TypeScript and Next.js build errors without starting a server or touching the database.

## Deploy Preview
- Trigger a Vercel Preview deployment from the current branch.
- Wait for build completion and obtain the preview URL.

## Validation On Preview
- Access the preview URL and confirm auth redirect behavior:
  - Unauthenticated access redirects to `/auth` (`src/middleware.ts`:10–18, 26–29).
- Log in using the existing admin credentials:
  - Credentials provider queries `users` and compares bcrypt password (`src/app/api/auth/[...nextauth]/route.ts`:16–47; `src/lib/auth.ts`:3–13).
- Verify protected pages under `src/app/(dashboard)/**` render.
- Read-only API checks first:
  - `GET /api/leads`, `GET /api/team`, `GET /api/activities` return data without errors.
- Observe Vercel logs for any `console.*` outputs from API and storage layers to capture issues quickly.

## Contingencies
- If build fails: report compile errors with exact file paths and lines.
- If login fails or APIs error:
  - Capture the HTTP status and stack from logs; reference the exact handler location (e.g., `src/app/api/leads/route.ts` and `src/lib/storage.ts`).
- Avoid running migrations against live until we confirm schema exists. If a "relation does not exist" error appears, we will propose a safe migration plan before acting.

## Safety
- No write endpoints will be exercised initially; focus on login and reads. We will only test mutations after you confirm.

If approved, I will perform the build-only check, deploy a Vercel Preview wired to your provided environment values, test admin login and key read APIs on the preview URL, and report any errors with exact file references and proposed fixes.