## Diagnosis
- Authentication uses Credentials provider and matches by `username`, not email (see `src/app/api/auth/[...nextauth]/route.ts:16–25`).
- Passwords are verified via bcrypt (`comparePasswords`) against the hashed value in DB (see `src/lib/auth.ts:9–13`).
- If admin user doesn’t exist or the stored password isn’t hashed, login will fail.
- Ensure `NEXTAUTH_SECRET` (and `NEXTAUTH_URL` in production) are set.

## Immediate Recovery (Create Admin)
- Use the existing register endpoint to create an admin:
- POST `http://localhost:3000/api/register`
- Body (JSON):
  {
    "username": "admin",
    "password": "<strong-password>",
    "email": "admin@example.com",
    "name": "Admin",
    "role": "admin"
  }
- Behavior: validates, hashes the password, and inserts user (see `src/app/api/register/route.ts:36–45`).
- Then sign in with `username=admin`, `password=<strong-password>` at `/auth`.

## If Register Fails (Duplicate/Schema)
- Confirm no existing conflicting `username/email` using your DB console.
- If an admin exists with a mismatched password (e.g., plain text), recreate via register with a new unique username (e.g., `admin2`).

## Post-Login Admin Tools
- Reset non-admin users: `POST /api/admin/reset-users` requires admin (see `src/app/api/admin/reset-users/route.ts:6–12`).

## Configuration Checklist
- Set `NEXTAUTH_SECRET` and, in production, `NEXTAUTH_URL`.
- Use `username` field to sign in (the provider does not authorize by email).
- Ensure database-stored `users.password` is bcrypt-hashed; the register route handles hashing.

## Security Notes
- Do not expose service role keys; keep secrets server-only.
- Rotate any previously exposed keys and update your env store.

## Acceptance Criteria
- Admin can sign in successfully at `/auth`.
- Session includes `user.role = 'admin'`.
- Admin-only endpoint `/api/admin/reset-users` returns 200 when invoked.
