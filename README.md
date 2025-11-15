# FlipStackk CRM - Production Real Estate Platform

A comprehensive real estate deal management platform built with Next.js 16, TypeScript, PostgreSQL (Supabase), and deployed on Vercel.

## 🚀 Production Ready - Deploy to Vercel + Supabase

This application is **fully functional and production-ready** with:
- ✅ 11 complete pages (Leads, Calls, Timesheets, Team, Settings, Dashboard, Map, Calculator, Analytics, Activities, Auth)
- ✅ Secure authentication (NextAuth + bcrypt, no demo passwords)
- ✅ Supabase PostgreSQL with connection pooling for serverless
- ✅ Complete admin seeding scripts
- ✅ Production environment documentation

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```

Visit http://localhost:3000 (configured for port 3000)

### Production Build
```bash
npm run build
npm start
```

## 📦 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth (JWT)
- **Styling**: Tailwind CSS v3
- **UI Components**: Radix UI + shadcn/ui

## 🗄️ Database Schema

- **users** - User accounts with role-based access
- **leads** - Property leads and contacts
- **calls** - Call logging and notes
- **scheduledCalls** - Upcoming call reminders
- **teamMembers** - Team member profiles
- **activities** - Activity audit trail
- **timesheets** - Time tracking entries

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:5000
NEXTAUTH_SECRET=your-secret-here
```

## 📚 API Routes

All API routes require authentication (except `/api/register`):

- `POST /api/register` - Create new user
- `GET /api/user` - Get current user
- `GET|POST /api/leads` - Manage leads
- `GET|PUT|DELETE /api/leads/[id]` - Individual lead operations
- `GET|POST /api/calls` - Manage calls
- `GET|DELETE /api/calls/[id]` - Individual call operations
- `GET|POST /api/scheduled-calls` - Manage scheduled calls
- `PUT|DELETE /api/scheduled-calls/[id]` - Individual scheduled call operations
- `GET|POST /api/timesheets` - Manage timesheets
- `PUT|DELETE /api/timesheets/[id]` - Individual timesheet operations
- `GET|POST /api/team` - Team management
- `GET /api/activities` - Activity log

## 🛠️ Database Commands

```bash
# Push schema changes
npm run db:push

# Force push (if conflicts)
npm run db:push --force

# Generate migrations (not recommended - use push instead)
npm run db:generate
```

## 📖 Documentation

**Complete Production Setup:** See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for step-by-step Supabase + Vercel deployment guide.

**Quick Deploy Summary:**
1. Create Supabase project → Get pooled DATABASE_URL
2. Push to GitHub → Import to Vercel
3. Add environment variables (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
4. Deploy → Run SQL to create admin user
5. Login and start managing deals!

## 🎯 Application Features

**✅ Complete Pages:**
1. **Authentication** - Login/Register with secure bcrypt hashing
2. **Dashboard** - Metrics, stats, activity feed, upcoming calls
3. **Leads Management** - Full CRUD, filters, search, import/export
4. **Calls** - Log calls, schedule callbacks, view history
5. **Timesheets** - Time tracking with approval workflow
6. **Team** - User management with performance stats
7. **Settings** - Profile and security management
8. **Property Map** - Interactive Leaflet map with lead markers
9. **Deal Calculator** - Flip analysis with ROI calculations
10. **Analytics** - Performance charts and conversion tracking
11. **Activities** - System activity feed with filtering

**✅ API Routes (14 endpoints):**
- Authentication, Leads, Calls, Scheduled Calls, Timesheets, Team, Activities, User management

**📖 Complete Documentation:**
- [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) - Step-by-step Supabase + Vercel deployment
- [scripts/create-admin.sql](./scripts/create-admin.sql) - Admin user creation script

## 📄 License

Private project - All rights reserved
