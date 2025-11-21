# Production Rollback Procedures

## Emergency Rollback Plan

### 1. Database Rollback

#### Immediate Database Restoration
```bash
# Stop the application first
pm2 stop nextjs-app  # or your process manager command

# Create backup of current state (if possible)
pg_dump $DATABASE_URL > emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from known good backup
pg_restore -d $DATABASE_URL --clean --if-exists backup_before_deployment.sql

# Verify database integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT * FROM notifications LIMIT 5;"
```

#### Database Rollback Checklist
- [ ] Application stopped to prevent data corruption
- [ ] Current database state backed up (if possible)
- [ ] Known good backup file identified
- [ ] Database restoration completed successfully
- [ ] Database integrity verified
- [ ] Foreign key constraints validated

### 2. Application Code Rollback

#### Git-based Rollback
```bash
# List recent deployments
git log --oneline -10

# Revert to previous stable commit
git checkout <previous-stable-commit-hash>

# Or revert specific problematic commits
git revert <problematic-commit-hash>

# Install dependencies and rebuild
npm install
npm run build

# Restart application
pm2 restart nextjs-app
```

#### Application Rollback Checklist
- [ ] Previous stable commit identified
- [ ] Code reverted successfully
- [ ] Dependencies reinstalled
- [ ] Application rebuilt without errors
- [ ] Application restarted successfully
- [ ] Functionality verified

### 3. Configuration Rollback

#### Environment Variables
```bash
# Backup current environment
cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)

# Restore previous configuration
cp .env.production.previous .env.production

# Restart application to apply changes
pm2 restart nextjs-app
```

#### Configuration Rollback Checklist
- [ ] Current configuration backed up
- [ ] Previous configuration restored
- [ ] Application restarted with new config
- [ ] Configuration changes verified

## Rollback Scenarios

### Scenario 1: Database Migration Failure
**Symptoms**: Application crashes, database errors in logs
**Action**:
1. Stop application immediately
2. Restore database from pre-deployment backup
3. Revert application code if necessary
4. Restart application
5. Verify functionality

### Scenario 2: Critical Bug in New Code
**Symptoms**: 500 errors, broken functionality, user complaints
**Action**:
1. Identify problematic code changes
2. Revert specific commits or checkout previous version
3. Rebuild and restart application
4. Test critical functionality
5. Monitor for continued issues

### Scenario 3: Configuration Error
**Symptoms**: Connection failures, authentication issues
**Action**:
1. Restore previous configuration
2. Restart application
3. Verify connections and authentication
4. Test affected functionality

### Scenario 4: Performance Degradation
**Symptoms**: Slow response times, timeout errors
**Action**:
1. Check database performance metrics
2. Review recent code changes
3. Consider partial rollback of recent features
4. Monitor performance metrics

## Rollback Decision Matrix

### Immediate Rollback Required
- Database corruption detected
- Complete application failure
- Security vulnerability introduced
- Data integrity issues
- Authentication system broken

### Delayed Rollback (Investigate First)
- Performance degradation
- Minor functionality issues
- Non-critical bugs
- User experience issues
- Configuration problems

### No Rollback Needed
- Minor UI issues
- Documentation updates
- Monitoring alerts (false positives)
- Expected behavior changes

## Rollback Communication Plan

### Internal Communication
1. **Immediate**: Notify DevOps team
2. **Within 15 minutes**: Update development team
3. **Within 30 minutes**: Inform stakeholders
4. **Within 1 hour**: Provide status update

### External Communication
1. **If user-facing**: Prepare status page update
2. **If critical**: Send user notification
3. **Post-incident**: Provide incident report

## Rollback Testing

### Pre-Rollback Testing
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Test application build
npm run build

# Test critical endpoints
curl -f http://localhost:3000/api/health || exit 1
```

### Post-Rollback Verification
- [ ] Application starts successfully
- [ ] Database connection established
- [ ] Authentication system working
- [ ] Core functionality operational
- [ ] No critical errors in logs
- [ ] Performance metrics normal

## Rollback Automation

### Automated Rollback Triggers
- Health check failures for 5+ minutes
- Error rate > 10% for 10+ minutes
- Database connection failures
- Memory usage > 90%
- CPU usage > 95% for 15+ minutes

### Manual Rollback Commands
```bash
# Quick rollback script
#!/bin/bash
echo "Starting emergency rollback..."
pm2 stop nextjs-app
git checkout HEAD~1
npm install
npm run build
pm2 start nextjs-app
echo "Rollback completed"
```

## Rollback Documentation

### Required Information
- Time of rollback initiation
- Reason for rollback
- Steps taken
- Duration of rollback
- Verification results
- Lessons learned

### Post-Rollback Actions
1. Document the incident
2. Identify root cause
3. Implement preventive measures
4. Update deployment procedures
5. Conduct post-mortem review

## Contact Information

### Emergency Contacts
- **Primary On-Call**: [Phone Number]
- **Database Admin**: [Phone Number]
- **DevOps Lead**: [Phone Number]
- **Development Manager**: [Phone Number]

### Escalation Path
1. On-Call Engineer (0-30 minutes)
2. DevOps Lead (30-60 minutes)
3. Engineering Manager (60+ minutes)
4. CTO (Critical issues only)

---

**Last Updated**: $(date)
**Version**: 1.0
**Next Review**: $(date -d "+3 months")