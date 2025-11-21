## Diagnosis
- Reproduce: submit registration with an email that already exists; DB unique constraint on `users.email` triggers an unhandled error → 500 response.
- Code review: `src/app/api/register/route.ts` checks only duplicate `username` and not `email`; insert relies on DB constraint for email, causing 500. Catch block returns 500 for all non-Zod errors.

## Fixes
1) Add duplicate email check before insert (400/409 error with clear message).
2) Handle Postgres unique violation (`code: 23505`) in catch block to return 409 with specific field (username/email).
3) Improve server-side logging: include error code and detail for failures.
4) Keep client handling: read `message` or `errors` and toast appropriately (already implemented). Ensure it shows server-provided message.

## Steps
- Update `src/app/api/register/route.ts`:
  - Check `storage.getUserByEmail(body.email)` and return error if exists.
  - In catch, if `(error as any).code === '23505'`, return 409 with parsed duplicate field.
  - Otherwise, log structured error and return 500 with generic message.
- Rebuild and restart local preview.
- Test cases:
  - Valid, new user → 201 Created.
  - Duplicate username → 400/409 with "Username already exists".
  - Duplicate email → 400/409 with "Email already exists".
  - Invalid payload (missing fields) → 400 with Zod issues.

## Preventative Measures
- Standardize error responses shape.
- Recommend adding rate limiting and CSRF for register/login later.
- Plan follow-up: RBAC enforcement and password recovery implementation.

If approved, I’ll implement the route fix, rebuild, restart the server, and run the test matrix, reporting results and any remaining issues.