## Issue
Next.js build fails: `Cannot find module '@playwright/test'` from `playwright.config.ts`. The build’s TypeScript phase scans all `**/*.ts` files and hits the Playwright config.

## Plan
1) Install dev dependency:
- `npm i -D @playwright/test`

2) Exclude E2E files from app TypeScript checks:
- Update `tsconfig.json` `exclude` to add:
  - `playwright.config.ts`
  - `e2e/**/*`

3) Verify build:
- `npm run build`

4) Start server:
- For production build: `npm start` (requires successful build)
- For local development: `npm run dev` (hot reload)

## Notes
- E2E CI already installs Playwright; this isolates app builds from test config locally and in production.

If approved, I will update `tsconfig.json`, install the dependency, and run the build, then start the server.