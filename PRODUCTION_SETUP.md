# 🚀 Production Setup Guide - Supabase + Vercel

Complete guide to deploy FlipStackk CRM to production with real data and accounts.

## ✅ Prerequisites

- GitHub account
- Vercel account (free tier works)
- Supabase account (free tier works)
- Local development environment with Node.js 18+

---

## 📦 Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Project name**: `flipstackk-crm` (or your choice)
   - **Database password**: Generate a strong password and **save it securely**
   - **Region**: Choose closest to your users
4. Click "Create new project" (takes ~2 minutes)

### 1.2 Get Connection String

1. In your Supabase project, go to **Settings** → **Database**
2. Scroll to **Connection String** section
3. Select **Connection pooling** tab (critical for Vercel!)
4. Copy the **Connection string** (should look like):
   ```
   postgresql://postgres.xxxxxxxxxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password

### 1.3 Initialize Database Schema

From your local `nextjs-crm` directory:

```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# Edit .env.local and add your Supabase DATABASE_URL
# nano .env.local or use your editor

# Push schema to Supabase
npm run db:push
```

You should see:
```
✓ Pushing schema changes to database
✓ Success! Your database is now up to date.
```

### 1.4 Create First Admin User

Option A: **Using SQL Editor** (Recommended)

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Paste this SQL (replace password with your secure password):

```sql
-- First, install pgcrypto if not already available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin user with bcrypt-hashed password
INSERT INTO users (username, email, password, name, role, created_at, updated_at)
VALUES (
  'admin',
  'admin@yourcompany.com',
  crypt('YourSecurePassword123!', gen_salt('bf', 10)),
  'Admin User',
  'admin',
  NOW(),
  NOW()
);
```

4. Click "Run" 
5. **Save your credentials**:
   - Username: `admin`
   - Password: `YourSecurePassword123!` (use what you chose)

Option B: **Using Drizzle Studio** (Alternative)

```bash
npm run db:studio
# Open http://localhost:4983
# Manually create user (password must be pre-hashed with bcrypt)
```

---

## 🔐 Step 2: Generate Production Secrets

### 2.1 Generate NEXTAUTH_SECRET

Run this command locally:

```bash
openssl rand -base64 32
```

Copy the output - you'll need it for environment variables.

Example output:
```
xK9mF2nP4sQ8tR7vW5yX3zA6bC1dE0fG2hI4jK7lM9n=
```

---

## 🌐 Step 3: Deploy to Vercel

### 3.1 Push Code to GitHub

```bash
cd nextjs-crm

# Initialize git if not already done
git init
git add .
git commit -m "Production-ready FlipStackk CRM"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR-USERNAME/flipstackk-crm.git
git branch -M main
git push -u origin main
```

### 3.2 Connect Vercel to GitHub

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your `flipstackk-crm` repository
4. **Configure Project**:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

### 3.3 Add Environment Variables

Before clicking "Deploy", add these environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase pooled connection string |
| `NEXTAUTH_URL` | `https://your-app-name.vercel.app` (Vercel will show this) |
| `NEXTAUTH_SECRET` | Output from `openssl rand -base64 32` |

**Optional** (for Twilio features):
| Variable | Value |
|----------|-------|
| `TWILIO_ACCOUNT_SID` | Your Twilio SID |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number |

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://flipstackk-crm-abc123.vercel.app`

### 3.5 Update NEXTAUTH_URL

After first deployment:

1. Copy your Vercel deployment URL
2. Go to Vercel dashboard → Your project → Settings → Environment Variables
3. Edit `NEXTAUTH_URL` to match your actual URL
4. Redeploy (Vercel → Deployments → click "..." → Redeploy)

---

## ✅ Step 4: Test Production Deployment

### 4.1 Test Authentication

1. Visit your Vercel URL
2. You should be redirected to `/auth`
3. Try logging in with your admin credentials:
   - Username: `admin`
   - Password: (the password you set in SQL)
4. Should redirect to `/dashboard` on success

### 4.2 Test Features

1. ✅ **Leads**: Create a new lead
2. ✅ **Calls**: Log a call
3. ✅ **Timesheets**: Submit timesheet entry
4. ✅ **Team**: View team members
5. ✅ **Settings**: Update your profile

### 4.3 Create Additional Users

Two options:

**A. Self-Registration** (if enabled):
- Go to `/auth`
- Click "Register" tab
- Fill out form

**B. Admin Invitation** (recommended for production):
- Admin creates user via SQL or future admin panel
- User receives invite link
- Sets password on first login

---

## 🔒 Security Checklist

Before going live:

- [ ] `NEXTAUTH_SECRET` is strong and unique
- [ ] Database password is strong and secure
- [ ] No secrets committed to Git repository
- [ ] `.env.local` is in `.gitignore`
- [ ] Admin account uses strong password
- [ ] Supabase Row Level Security enabled (optional but recommended)
- [ ] Vercel deployment uses HTTPS (automatic)
- [ ] Test login/logout flow works correctly

---

## 🎯 Post-Deployment

### Add Custom Domain (Optional)

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `app.yourcompany.com`)
3. Follow DNS configuration steps
4. Update `NEXTAUTH_URL` to your custom domain
5. Redeploy

### Enable Monitoring

1. **Vercel Analytics**: Automatically enabled
2. **Supabase Logs**: Go to Logs section to monitor database queries
3. **Error Tracking**: Consider adding Sentry (optional)

### Backup Strategy

1. **Database Backups**: Supabase auto-backs up daily (free tier: 7 days retention)
2. **Manual Backup**: Use Supabase Dashboard → Database → Backups → Create backup
3. **Code Backup**: GitHub repository

---

## 🆘 Troubleshooting

### Build Fails on Vercel

**Error**: `DATABASE_URL is not defined`
- **Solution**: Add `DATABASE_URL` to environment variables in Vercel settings

**Error**: TypeScript compilation errors
- **Solution**: Run `npm run build` locally to catch errors before deploying

### Can't Log In

**Error**: "Invalid username or password"
- **Solution**: Verify user exists in database (Supabase → Table Editor → users)
- **Solution**: Check password was hashed correctly with bcrypt

**Error**: "Callback URL mismatch"
- **Solution**: Ensure `NEXTAUTH_URL` matches your actual Vercel URL

### Database Connection Issues

**Error**: "Connection timeout"
- **Solution**: Use **pooled** connection string (port 6543), not direct (port 5432)
- **Solution**: Ensure Supabase project is not paused (free tier auto-pauses after 7 days inactivity)

**Error**: "Too many connections"
- **Solution**: Connection pooling string should include `?pgbouncer=true&connection_limit=1`

---

## 📚 Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [NextAuth.js Production Guide](https://next-auth.js.org/deployment)
- [Drizzle ORM Migrations](https://orm.drizzle.team/kit-docs/overview)

---

## 🎉 You're Live!

Your FlipStackk CRM is now running in production with:
- ✅ Secure authentication
- ✅ PostgreSQL database (Supabase)
- ✅ Serverless deployment (Vercel)
- ✅ HTTPS encryption
- ✅ Auto-scaling
- ✅ Global CDN

Start managing your real estate deals! 🏠💼
