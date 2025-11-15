# 🚀 Deploy FlipStackk CRM to Production - Quick Guide

Your app is **100% ready to deploy**! Follow these steps to go live on Vercel with Supabase.

---

## ⚡ Quick Deploy (5 Minutes)

### Step 1: Push to GitHub

Run these commands in the `nextjs-crm` folder:

```bash
cd nextjs-crm
git add .
git commit -m "Production-ready FlipStackk CRM"
git push -u origin main
```

### Step 2: Create Admin User in Supabase

1. Go to: https://supabase.com/dashboard/project/octipyiqduroxelobtli
2. Click **"SQL Editor"** (left sidebar)
3. Click **"New Query"**
4. Paste this SQL and **CHANGE THE PASSWORD**:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (username, email, password, name, role, created_at, updated_at)
VALUES (
  'admin',
  'admin@flipstackk.com',
  crypt('YourSecurePassword123!', gen_salt('bf', 10)),
  'Admin User',
  'admin',
  NOW(),
  NOW()
);
```

5. Click **"Run"**
6. You should see "Success. 1 rows affected."

### Step 3: Get Pooled Database URL from Supabase

1. In Supabase dashboard, click **"Database"** → **"Connection Pooling"**
2. Set **Mode: Transaction**, **Port: 6543**
3. Copy the connection string (looks like this):

```
postgresql://postgres.octipyiqduroxelobtli:OTPSTACKK10M@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Step 4: Deploy to Vercel

1. Go to: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select: `Karfearsw/FlipStackk-CRM`
4. **Add Environment Variables** (click "Add" for each):

**Variable 1:**
```
Name: DATABASE_URL
Value: postgresql://postgres.octipyiqduroxelobtli:OTPSTACKK10M@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Variable 2:**
```
Name: NEXTAUTH_URL
Value: https://YOUR-APP-NAME.vercel.app
```
(Vercel will show you this URL after deploy - you'll update it in Step 5)

**Variable 3:**
```
Name: NEXTAUTH_SECRET
Value: 8IHi8WfCP2eL/Abk5BcCG4ToySALYRWnAVWMIYvpDfs=
```

5. Click **"Deploy"**
6. Wait 2-3 minutes for build to complete

### Step 5: Update NEXTAUTH_URL (IMPORTANT!)

After your first deploy, Vercel will give you a URL like `https://flip-stackk-crm-abc123.vercel.app`

1. Copy your exact Vercel URL
2. Go to Vercel → Your Project → **Settings** → **Environment Variables**
3. Find `NEXTAUTH_URL` and click **"Edit"**
4. Update value to your exact URL: `https://flip-stackk-crm-abc123.vercel.app`
5. Save
6. Go to **Deployments** → Click `...` on latest → **Redeploy**

### Step 6: Login and Test! 🎉

1. Visit your Vercel URL
2. Login with:
   - **Username:** `admin`
   - **Password:** (the password you set in Step 2)
3. Test features:
   - Create a lead
   - Log a call
   - Check dashboard

---

## 🔧 Troubleshooting

### "Database connection failed"
- **Fix:** Make sure you're using the **POOLED** connection (port 6543) from Step 3, NOT the direct connection (port 5432)

### "NextAuth callback error"
- **Fix:** Verify `NEXTAUTH_URL` in Vercel settings **exactly** matches your Vercel domain (with https://)

### "Cannot login after deploy"
- **Fix:** Did you run the SQL in Step 2 to create admin user? Check in Supabase SQL Editor:
  ```sql
  SELECT * FROM users WHERE role = 'admin';
  ```

### Build fails on Vercel
- **Fix:** Check Vercel deployment logs for specific error. Common issue: environment variables not set correctly.

---

## 📋 Environment Variables Reference

### Local Development (.env.local) - Already Set ✅
```bash
DATABASE_URL=postgresql://postgres:OTPSTACKK10M@db.octipyiqduroxelobtli.supabase.co:5432/postgres
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=8IHi8WfCP2eL/Abk5BcCG4ToySALYRWnAVWMIYvpDfs=
```

### Production (Vercel) - You Need to Add
```bash
DATABASE_URL=postgresql://postgres.octipyiqduroxelobtli:OTPSTACKK10M@aws-0-us-east-1.pooler.supabase.com:6543/postgres
NEXTAUTH_URL=https://your-actual-vercel-url.vercel.app
NEXTAUTH_SECRET=8IHi8WfCP2eL/Abk5BcCG4ToySALYRWnAVWMIYvpDfs=
```

**⚠️ KEY DIFFERENCE:** Production uses **pooled** connection (port 6543), local uses **direct** (port 5432)

---

## ✅ Deployment Checklist

- [ ] Step 1: Code pushed to GitHub
- [ ] Step 2: Admin user created in Supabase SQL Editor
- [ ] Step 3: Pooled database URL copied from Supabase
- [ ] Step 4: Deployed to Vercel with all 3 environment variables
- [ ] Step 5: Updated NEXTAUTH_URL to actual Vercel domain and redeployed
- [ ] Step 6: Tested login and key features

---

## 🎯 What's Included in Your App

**11 Complete Pages:**
1. Authentication (Login/Register)
2. Dashboard (Metrics + Activity Feed)
3. Leads Management (CRUD + Filters)
4. Calls (Logging + Scheduling)
5. Timesheets (Time Tracking)
6. Team Management
7. Settings (Profile + Security)
8. Property Map (Interactive Leaflet)
9. Deal Calculator (Flip Analysis)
10. Analytics (Charts)
11. Activities (System Log)

**Production Security:**
- ✅ Bcrypt password hashing (10 rounds)
- ✅ NextAuth JWT sessions
- ✅ Protected API routes
- ✅ No demo/test credentials

---

## 🆘 Need More Help?

See `PRODUCTION_SETUP.md` for detailed setup instructions with screenshots and advanced configuration.

---

**You're 5 minutes away from having your CRM live in production! 🚀**
