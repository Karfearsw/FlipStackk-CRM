# Deploy to Vercel - Complete Guide

## ✅ Pre-Deployment Checklist

Your app is ready to deploy! Build completed successfully with all routes working.

## 🚀 Step-by-Step Deployment

### 1. Push to GitHub

```bash
cd nextjs-crm
git init
git add .
git commit -m "Initial Next.js CRM migration"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### 3. Configure Environment Variables

In Vercel's dashboard, add these environment variables:

#### Required:
```
DATABASE_URL=your-postgresql-connection-string
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

#### Optional (Twilio for SMS):
```
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-phone-number
```

### 4. Generate NEXTAUTH_SECRET

Run this command locally:
```bash
openssl rand -base64 32
```

Copy the output and paste it as the `NEXTAUTH_SECRET` value in Vercel.

### 5. Set Up Database

**Option A: Use Supabase (Recommended)**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get connection string from Settings → Database
4. Use the connection pooler URL for serverless
5. Run schema migration:
   ```bash
   npm run db:push
   ```

**Option B: Use Neon (Serverless Postgres)**
1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Run schema migration locally

**Option C: Use Vercel Postgres**
1. In Vercel dashboard, go to Storage tab
2. Create Postgres database
3. Connection string auto-added to env vars
4. Run migration from Vercel terminal

### 6. Deploy

Click "Deploy" in Vercel. The build will:
- ✅ Install dependencies
- ✅ Run TypeScript compilation
- ✅ Generate optimized production build
- ✅ Deploy to edge network

## 📊 What's Included

### ✅ Working Features:
- **Authentication**: NextAuth with JWT sessions
- **API Routes** (8 endpoints):
  - `/api/register` - User registration
  - `/api/user` - Get current user
  - `/api/leads` - Lead CRUD operations
  - `/api/calls` - Call logging
  - `/api/scheduled-calls` - Call scheduling
  - `/api/timesheets` - Time tracking
  - `/api/team` - Team management
  - `/api/activities` - Activity logging
- **Database**: 7 tables with Drizzle ORM
- **UI**: Auth page + Dashboard layout

### ⚠️ Not Yet Implemented:
- Leads management page (UI)
- Calls management page (UI)
- Timesheets page (UI)
- Team management page (UI)
- Settings page (UI)
- WebSocket features (not supported on Vercel - would need polling/SSE)

## 🔧 Post-Deployment

### Test Your Deployment:
1. Visit `https://your-app.vercel.app`
2. You should be redirected to `/auth`
3. Try registering a new user
4. Test login

### Create First Admin User:
```bash
# Connect to your database and run:
INSERT INTO users (username, password, email, name, role, created_at, updated_at)
VALUES (
  'admin',
  '$2b$10$YourHashedPasswordHere',  -- Hash your password first
  'admin@example.com',
  'Admin User',
  'admin',
  NOW(),
  NOW()
);
```

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | Your app URL (https://yourapp.vercel.app) |
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT signing |
| `TWILIO_ACCOUNT_SID` | No | For SMS notifications |
| `TWILIO_AUTH_TOKEN` | No | For SMS notifications |
| `TWILIO_PHONE_NUMBER` | No | For SMS notifications |

## 🎯 Next Steps After Deployment

1. **Build remaining UI pages** (leads, calls, timesheets)
2. **Add data validation** and better error handling
3. **Implement real-time updates** using polling or Server-Sent Events
4. **Add file uploads** for lead documents
5. **Create admin dashboard** for user management
6. **Set up monitoring** with Vercel Analytics

## 💡 Tips

- **Domain**: Add custom domain in Vercel dashboard → Settings → Domains
- **Performance**: Vercel automatically optimizes images and caching
- **Logs**: View real-time logs in Vercel dashboard
- **Rollback**: Easy one-click rollback to previous deployments
- **Preview**: Every Git push creates a preview deployment

## 🆘 Troubleshooting

**Build fails**: Check environment variables are set correctly

**Database errors**: Verify DATABASE_URL and run `npm run db:push`

**Auth not working**: Ensure NEXTAUTH_URL matches your deployment URL

**API errors**: Check Vercel function logs in dashboard

---

🎉 **Your CRM is ready for production on Vercel!**
