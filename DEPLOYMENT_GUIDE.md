# Deployment Guide

This guide provides comprehensive instructions for deploying the FlipStackk CRM MVP to production environments.

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests pass successfully
- [ ] No console errors or warnings
- [ ] Code follows project conventions
- [ ] Security vulnerabilities addressed
- [ ] Performance optimizations implemented

### Environment Configuration
- [ ] Environment variables configured
- [ ] Database connection established
- [ ] Authentication secrets generated
- [ ] SSL certificates obtained
- [ ] Domain name configured

### Database Setup
- [ ] Database schema deployed
- [ ] Initial data seeded
- [ ] Backup procedures established
- [ ] Monitoring configured
- [ ] Performance indexes created

## Vercel Deployment (Recommended)

### Step 1: Repository Setup
1. Push your code to a GitHub repository
2. Ensure all environment variables are in `.env.local`
3. Verify the application builds locally: `npm run build`

### Step 2: Vercel Configuration
1. Visit [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure build settings:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Step 3: Environment Variables
Add these environment variables in Vercel dashboard:
```
DATABASE_URL=postgresql://user:password@host:port/database
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://your-domain.com
```

### Step 4: Deploy
1. Click "Deploy" button
2. Wait for build to complete
3. Verify deployment success
4. Test all functionality in production

### Step 5: Custom Domain
1. Go to project settings in Vercel
2. Add custom domain
3. Configure DNS records as instructed
4. Enable SSL automatically

## Self-Hosted Deployment

### Option 1: Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=flipstackk
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Deployment Steps
1. Install Docker and Docker Compose
2. Create `.env` file with environment variables
3. Run: `docker-compose up -d`
4. Verify application is running on port 3000

### Option 2: Manual Server Deployment

#### Server Requirements
- Node.js 18+ 
- PostgreSQL 14+
- Nginx (recommended)
- PM2 (for process management)

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx
```

#### Step 2: Application Setup
```bash
# Clone repository
git clone https://github.com/your-org/flipstackk-crm.git
cd flipstackk-crm

# Install dependencies
npm install

# Build application
npm run build

# Set up environment variables
cp .env.example .env.production
# Edit .env.production with production values
```

#### Step 3: Database Setup
```bash
# Create database
sudo -u postgres createdb flipstackk

# Create user
sudo -u postgres psql -c "CREATE USER flipstackk WITH PASSWORD 'your-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE flipstackk TO flipstackk;"

# Run migrations
npm run db:push
```

#### Step 4: Process Management
```bash
# Start application with PM2
pm2 start npm --name "flipstackk-crm" -- start

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup systemd
```

#### Step 5: Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Step 6: SSL Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## Production Optimizations

### Performance
- Enable gzip compression in Nginx
- Configure browser caching headers
- Optimize database queries with indexes
- Enable Next.js production optimizations
- Set up CDN for static assets

### Security
- Configure firewall rules
- Set up rate limiting
- Enable security headers
- Configure CORS properly
- Set up monitoring and alerting

### Monitoring
- Set up application logging
- Configure error tracking
- Monitor database performance
- Set up uptime monitoring
- Configure backup automation

## Post-Deployment Verification

### Functionality Testing
- [ ] Authentication works correctly
- [ ] All API endpoints respond properly
- [ ] Database connections are stable
- [ ] File uploads function correctly
- [ ] Email notifications work (if configured)

### Performance Testing
- [ ] Page load times are acceptable (< 3 seconds)
- [ ] API response times are fast (< 500ms)
- [ ] Database queries are optimized
- [ ] Static assets are cached properly

### Security Testing
- [ ] HTTPS is enforced
- [ ] Security headers are present
- [ ] Authentication is working
- [ ] Rate limiting is active
- [ ] Input validation is functioning

## Maintenance Procedures

### Regular Updates
- Monitor for security updates
- Update dependencies monthly
- Review and optimize database performance
- Check server resource usage

### Backup Strategy
- Database backups daily
- Application code backups weekly
- Configuration backups monthly
- Test restore procedures regularly

### Monitoring
- Set up alerts for downtime
- Monitor application errors
- Track performance metrics
- Review access logs regularly

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version and dependencies
2. **Database Connection**: Verify credentials and network access
3. **Authentication Issues**: Check NEXTAUTH_SECRET and URL configuration
4. **Performance Problems**: Review database indexes and query optimization
5. **SSL Certificate Issues**: Verify domain configuration and renewal

### Support Resources
- Application logs: Check PM2 logs or Docker logs
- Database logs: Check PostgreSQL error logs
- Nginx logs: Check access and error logs
- Monitoring dashboard: Review performance metrics

## Rollback Procedures

### Quick Rollback
1. Keep previous version tagged in Git
2. Have database migration rollback scripts ready
3. Maintain backup of previous working version
4. Test rollback procedures regularly

### Emergency Procedures
1. Immediate rollback to previous stable version
2. Database restoration from backup if needed
3. Communication plan for users
4. Post-incident review and improvements

This deployment guide ensures a smooth transition from development to production while maintaining security, performance, and reliability standards.