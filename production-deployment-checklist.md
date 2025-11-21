# Production Deployment Checklist

## Pre-Deployment Verification

### ✅ Database & Environment
- [ ] Database connection verified (PostgreSQL with Drizzle ORM)
- [ ] All environment variables configured:
  - `DATABASE_URL` - PostgreSQL connection string
  - `NEXTAUTH_SECRET` - NextAuth.js secret key
  - `NEXTAUTH_URL` - Application URL
  - `NODE_ENV=production`
- [ ] Database schema up to date with all tables created
- [ ] Notification system tables created and verified
- [ ] Database backup completed before deployment

### ✅ Authentication System
- [ ] NextAuth.js configured with Credentials provider
- [ ] Admin user credentials verified and working
- [ ] User registration and login functionality tested
- [ ] Session management working correctly

### ✅ API Endpoints
- [ ] Authentication endpoints: `/api/auth/*` - ✅ Working
- [ ] User management: `/api/users` - ✅ Working
- [ ] Registration: `/api/auth/register` - ✅ Working
- [ ] Notification system: `/api/notifications` - ✅ Working
- [ ] Marketing automation: `/api/marketing/*` - ✅ Working

### ✅ Data Cleanup
- [ ] Team member cleanup completed (keep only abcakdoor admin)
- [ ] Test data removed from production database
- [ ] Default notification preferences configured

### ✅ Error Handling
- [ ] Notification system errors resolved
- [ ] Database connection errors handled
- [ ] API error responses properly formatted
- [ ] Server-side error logging configured

## Deployment Steps

### 1. Environment Setup
```bash
# Set production environment variables
export NODE_ENV=production
export DATABASE_URL="postgresql://postgres:OTPSTACKK10M@db.octipyiqduroxelobtli.supabase.co:5432/postgres"
export NEXTAUTH_SECRET="your-generated-secret-here"
export NEXTAUTH_URL="https://your-domain.com"
```

### 2. Build Process
```bash
# Install dependencies
npm install

# Run TypeScript type checking
npm run type-check

# Build the application
npm run build

# Start production server
npm start
```

### 3. Database Migration
```bash
# Run database migrations (if any)
npx drizzle-kit push

# Verify all tables exist
# - users, notifications, notification_preferences
# - email_queue, email_templates
# - marketing_workflows, channel_members, messages, leads, deals
```

### 4. Post-Deployment Verification

#### Admin Functionality Test
- [ ] Login with admin credentials: admin / YourSecurePassword123!
- [ ] Access admin dashboard
- [ ] Verify user management functionality
- [ ] Test notification system

#### API Testing
```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YourSecurePassword123!"}'

# Test notifications (requires auth)
curl -X GET http://localhost:3000/api/notifications \
  -H "Content-Type: application/json"
```

#### Performance Checks
- [ ] Page load times under 3 seconds
- [ ] API response times under 500ms
- [ ] Database query performance optimized
- [ ] No memory leaks detected

## Monitoring & Rollback

### Monitoring Setup
- [ ] Application logs configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Database connection pool monitoring

### Rollback Procedures
1. **Database Rollback**:
   ```bash
   # Restore from backup if needed
   pg_restore -d your_database your_backup_file.sql
   ```

2. **Application Rollback**:
   ```bash
   # Revert to previous version
   git checkout previous-stable-tag
   npm install && npm run build
   npm start
   ```

3. **Configuration Rollback**:
   - Restore previous environment variables
   - Revert configuration changes
   - Restart application services

### Emergency Contacts
- Database Administrator: [Contact Info]
- DevOps Team: [Contact Info]
- Application Support: [Contact Info]

## Security Checklist

### Authentication & Authorization
- [ ] All API endpoints protected with proper authentication
- [ ] Role-based access control implemented
- [ ] Session timeout configured
- [ ] Password policies enforced

### Data Security
- [ ] Database connection encrypted
- [ ] Sensitive data encrypted at rest
- [ ] API rate limiting implemented
- [ ] Input validation and sanitization

### Infrastructure Security
- [ ] HTTPS enabled for all traffic
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Environment variables secured

## Post-Deployment Tasks

### 24-Hour Monitoring
- [ ] Monitor application logs for errors
- [ ] Check database performance metrics
- [ ] Verify notification system functionality
- [ ] Monitor user activity and authentication

### Weekly Checks
- [ ] Review error logs and fix any issues
- [ ] Monitor database growth and performance
- [ ] Check backup procedures are working
- [ ] Update security patches if needed

## Success Criteria

✅ **Deployment Successful When:**
- Application loads without errors
- Admin user can login successfully
- All core functionality works (CRUD operations)
- Notification system sends/receives notifications
- Database queries execute without errors
- API endpoints respond correctly
- No critical errors in logs
- Performance meets acceptance criteria

## Known Issues & Resolutions

### Fixed Issues
1. **Notification System Errors**: ✅ Resolved by creating notification tables
2. **Database Connection Issues**: ✅ Resolved by setting DATABASE_URL
3. **Foreign Key Constraints**: ✅ Handled in user cleanup process

### Pending Items
- [ ] Complete team member cleanup (abcakdoor admin only)
- [ ] Final production environment testing
- [ ] Backup verification

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Approved By**: ___________
**Rollback Plan Reviewed**: ✅ Yes