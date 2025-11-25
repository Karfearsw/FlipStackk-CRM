## Diagnose Terminal State
- Confirm working directory: `c:\flipstackk-crm\FlipStackk-CRM` is correct (the directory listing shows project files).
- Validate environment:
  - Node/NPM available (`node -v`, `npm -v`)
  - PATH includes npm bin (for `npx tsx` usage)
- If terminal session is stuck or misbehaving, fully close all existing terminal instances and reopen a fresh PowerShell session.

## Resolve Port Conflict (EADDRINUSE)
- Stop existing server listening on `3000` (the earlier `npm start` still runs):
  - Close the terminal running `npm start` or kill the PID bound to port 3000.
- Start on a different port to unblock immediately:
  - `npm start -- -p 3001`
- Verify `.next` exists (build succeeded) to avoid “No build” errors.

## Clean Build Warnings
- WhatsApp env warnings are non-blocking; suppress if not using WhatsApp:
  - Set `FEATURE_WHATSAPP=false` (and keep other non-core features disabled) in your env.
  - Alternatively, configure required WhatsApp envs if the integration is needed.

## Post-Start Smoke Checks
- `GET /api/health` → expect 200 and `status: ok` JSON (diagnostics are now unauthenticated).
- `/auth` page:
  - Registration: unique username/email/password → expect 201 with success toast
  - Login: seeded or newly registered user → expect 200 and session

## Supabase RLS Follow-up
- If registration still fails, add `INSERT/UPDATE` policies for `users` to permit writes under your role (e.g., `authenticated` or service role):
  - `CREATE POLICY users_insert_authenticated ON public.users FOR INSERT TO authenticated WITH CHECK (true);`
  - `CREATE POLICY users_update_authenticated ON public.users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);`
- Re-test `/api/register` after policy changes.

## If Terminal Still “Not Working”
- Fully close the IDE’s integrated terminals; reopen a fresh shell.
- Ensure no lingering background processes using `3000`.
- If PATH issues: open a new shell to refresh environment (especially after dependency adds).

On approval, I will stop the conflicting server, start on port 3001, run smoke tests, and (if needed) apply the users write policies to restore registration functionality, then report results.