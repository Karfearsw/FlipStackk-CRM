## Cause
Next.js TypeScript check scans all `**/*.ts` files per `tsconfig.json`. Because `playwright.config.ts` imports `@playwright/test`, and that package isn't installed (or test files are not excluded), the build fails with “Cannot find module '@playwright/test'”.

## Fix Plan
1. Install Playwright test dependency in dev:
- `npm i -D @playwright/test`

2. Exclude E2E artifacts from app TypeScript checking:
- Update `tsconfig.json` `exclude` to include:
  - `"playwright.config.ts"`
  - `"e2e/**/*"`
- This keeps Next’s type checking focused on app code and prevents test-only modules from affecting builds.

3. Verify locally:
- Run `npm run build` to confirm the TypeScript phase passes.

4. CI Alignment:
- No change needed for the existing E2E workflow; it installs Playwright and runs tests separately.
- Ensure CI uses `npm ci` (already configured) so `@playwright/test` is present.

## Optional (Alternative)
- If you prefer not to exclude E2E files, installing `@playwright/test` alone will satisfy module resolution. The recommended approach is to both install and exclude to decouple app builds from test config.

On approval, I will make the `tsconfig.json` change and run the install, then re-run the build to verify.