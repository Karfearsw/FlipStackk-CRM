## Root Causes
- Vercel deploy failed: `npm ci` lockfile mismatch because `@playwright/test` (and related) were added to `package.json` but not present in `package-lock.json` on the remote.
- Local `npm start` error: No production build found; `next build` must run successfully immediately before `npm start` in the current workspace.

## Plan To Fix
1) Lockfile Sync For Vercel
- Commit the updated `package-lock.json` reflecting `@playwright/test` (and any new dependencies).
- Push and redeploy. This keeps `vercel.json` `installCommand` (`npm ci --legacy-peer-deps`) intact and resolves EUSAGE.

2) Alternative (If You Prefer Not To Commit Lockfile Changes)
- Update `vercel.json` `installCommand` to `npm install --legacy-peer-deps` to avoid strict lockfile checks. (Recommended only if you intentionally do not use `npm ci`.)

3) Confirm Build Health
- Ensure app TypeScript excludes test-only files (already done) and `@playwright/test` is in devDeps.
- Verify with `npm run build` locally.

4) Start Locally Correctly
- Run `npm run build` then `npm start` to serve from `.next`.

## Steps I Will Perform
- Add/commit `package-lock.json` changes.
- Trigger a redeploy and confirm Vercel build passes.
- Verify local build → start.

On approval, I will sync the lockfile, run the build, and redeploy to resolve the deploy logs issue.