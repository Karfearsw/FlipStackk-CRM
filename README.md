# FlipStackk CRM MVP

A production-ready real estate CRM with analytics dashboard, documentation, and training materials.

## MVP Features

### Core Functionality
- **Authentication**: Secure login/register with role-based access (admin, acquisitions, caller, investor)
- **Dashboard**: Real-time KPIs, lead status distribution, recent activity feed
- **Analytics**: Lead conversion metrics, deal performance, sales velocity tracking
- **Lead Management**: Create, search, filter, assign leads with property details
- **Call Management**: Schedule calls, log call history with outcomes and duration
- **Team Management**: View team members and roles
- **Settings**: Profile management, password updates, avatar upload
- **Documentation**: Comprehensive training materials, tutorials, FAQs, API docs

### Technical Stack
- **Frontend**: Next.js 16.0.3 with App Router, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui components, Radix UI primitives
- **State**: TanStack Query for data fetching, Zod for validation
- **Auth**: NextAuth.js with credentials provider
- **Database**: PostgreSQL with Drizzle ORM
- **API**: RESTful endpoints with proper error handling
- **Analytics**: Built-in tracking for documentation engagement

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Configure your database connection and auth secret

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/flipstackk
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Leads
- `GET /api/leads` - List leads with filtering
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Calls
- `GET /api/calls` - Call history
- `POST /api/calls` - Log new call
- `GET /api/scheduled-calls` - Upcoming calls
- `POST /api/scheduled-calls` - Schedule call

### Analytics
- `GET /api/leads` - Lead metrics
- `GET /api/calls` - Call analytics
- `GET /api/deals` - Deal performance

### Documentation
- `GET /documentation` - Training materials and docs
- `POST /api/analytics/track` - Track user engagement

## MVP Testing Checklist

### Authentication Flow
- [ ] User can register with valid credentials
- [ ] User can login with correct username/password
- [ ] Protected routes redirect to login when unauthenticated
- [ ] Session persists across page refreshes

### Dashboard
- [ ] KPI cards display correct metrics
- [ ] Lead status distribution shows accurate data
- [ ] Recent activity feed updates in real-time
- [ ] Quick action buttons navigate to correct pages

### Lead Management
- [ ] Create new lead with all required fields
- [ ] Search and filter leads works correctly
- [ ] Pagination functions properly
- [ ] Lead details can be updated
- [ ] CSV import/export functionality

### Call Management
- [ ] Schedule calls with datetime picker
- [ ] Log calls with duration and outcome
- [ ] Call history displays correctly
- [ ] Upcoming calls list shows scheduled items

### Analytics
- [ ] Lead conversion rate calculates correctly
- [ ] Deal metrics display accurate data
- [ ] Property type distribution shows correctly
- [ ] All charts and progress bars render properly

### Documentation
- [ ] Documentation page loads with all sections
- [ ] Search functionality filters topics
- [ ] Interactive demos work correctly
- [ ] API documentation displays endpoints
- [ ] Analytics tracking captures user events

### Settings
- [ ] Profile information can be updated
- [ ] Password change functionality works
- [ ] Avatar upload functions correctly
- [ ] Settings persist after updates

## Deployment

### Vercel Deployment
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy with automatic builds on push

### Self-Hosted Deployment
1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Configure reverse proxy (nginx/apache)
4. Set up SSL certificates
5. Configure database backups

## Performance Optimization
- Images are optimized with Next.js Image component
- Database queries are indexed for performance
- API responses are cached where appropriate
- Client-side state is managed efficiently

## Security Features
- Passwords are hashed with bcrypt
- CSRF protection on all forms
- Input validation with Zod schemas
- Rate limiting on authentication endpoints
- Secure session management

## Monitoring & Analytics
- Built-in documentation analytics tracking
- Error logging and monitoring
- Performance metrics collection
- User engagement tracking

## Support
For issues or questions, please check the documentation at `/documentation` or contact the development team.