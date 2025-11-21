# Marketing Automation MVP

A comprehensive marketing automation system built for the FlipStackk CRM platform, featuring lead capture forms, workflow automation, personalized content delivery, and multi-channel campaign management.

## Features

### 🎯 Lead Capture & Forms
- **Responsive Forms**: Mobile-first, accessible forms with WCAG 2.1 AA compliance
- **Progressive Profiling**: Gradually collect lead information over multiple interactions
- **Conditional Fields**: Dynamic form fields based on user responses
- **Multi-step Forms**: Break complex forms into manageable steps
- **Real-time Validation**: Client and server-side validation with error handling

### 🤖 Workflow Automation
- **Visual Workflow Builder**: Drag-and-drop interface for creating automation sequences
- **Trigger-based Actions**: Respond to form submissions, lead updates, email opens, and more
- **Conditional Logic**: Complex branching based on lead attributes and behavior
- **Multi-channel Delivery**: Email, SMS, WhatsApp, and webhook integrations
- **A/B Testing**: Test different workflow variations for optimization

### 📊 Personalization Engine
- **Segment-based Targeting**: Create dynamic segments based on lead behavior and attributes
- **Content Personalization**: Deliver tailored content based on user profile
- **Behavioral Tracking**: Monitor user interactions across touchpoints
- **Recommendation Engine**: Suggest relevant content and offers

### 📈 Analytics & Reporting
- **Campaign Performance**: Track conversions, engagement, and ROI
- **Funnel Analysis**: Visualize customer journey and identify drop-off points
- **A/B Test Results**: Compare performance of different variants
- **Real-time Dashboards**: Monitor key metrics and KPIs

### 🔧 Integration & Extensibility
- **Webhook Support**: Real-time data synchronization with external systems
- **Plugin Architecture**: Extend functionality with custom modules
- **API Endpoints**: RESTful APIs for all marketing automation features
- **Provider Adapters**: Integrate with email, SMS, and messaging providers

## Architecture

### Core Components

```
src/
├── lib/marketing-automation/
│   ├── engine.ts          # Main automation engine
│   ├── types.ts           # TypeScript interfaces
│   └── providers/         # Integration providers
├── components/marketing-automation/
│   ├── lead-capture-form.tsx
│   ├── workflow-builder.tsx
│   ├── campaign-analytics.tsx
│   └── personalization-engine.tsx
└── app/api/marketing-automation/
    ├── route.ts           # Main API endpoints
    └── webhooks/
        └── route.ts       # Webhook management
```

### Data Flow

1. **Lead Capture**: Forms collect user data with validation
2. **Workflow Trigger**: Events trigger automation workflows
3. **Condition Evaluation**: Rules determine workflow path
4. **Action Execution**: Multi-channel actions are performed
5. **Analytics Tracking**: Performance metrics are recorded
6. **Personalization**: Content is tailored based on user data

## API Reference

### Forms API

```typescript
// Get all forms
GET /api/marketing-automation?type=forms

// Create new form
POST /api/marketing-automation?type=forms
{
  "name": "Property Evaluation Form",
  "fields": [...],
  "settings": {...}
}

// Submit form
POST /api/marketing-automation?type=submit-form
{
  "formId": "form_123",
  "data": {...}
}
```

### Workflows API

```typescript
// Get all workflows
GET /api/marketing-automation?type=workflows

// Create workflow
POST /api/marketing-automation?type=workflows
{
  "name": "Welcome Series",
  "trigger": {"type": "form_submission"},
  "actions": [...],
  "conditions": [...]
}
```

### Webhooks API

```typescript
// Get webhooks
GET /api/marketing-automation/webhooks

// Create webhook
POST /api/marketing-automation/webhooks
{
  "name": "Lead Creation Webhook",
  "url": "https://example.com/webhook",
  "events": ["lead.created", "lead.updated"],
  "secret": "webhook_secret"
}
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- PostgreSQL database
- WhatsApp Business API credentials
- Email/SMS provider accounts

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

```env
# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token

# Email Provider (SendGrid, Mailgun, etc.)
EMAIL_API_KEY=your_email_api_key
EMAIL_FROM_ADDRESS=noreply@yourcompany.com

# SMS Provider (Twilio, etc.)
SMS_API_KEY=your_sms_api_key
SMS_FROM_NUMBER=+1234567890
```

## Usage Examples

### Creating a Lead Capture Form

```tsx
import { LeadCaptureForm } from '@/components/marketing-automation/lead-capture-form';

const propertyEvaluationForm = {
  id: 'property_eval_form',
  name: 'Property Evaluation Form',
  fields: [
    {
      id: 'name',
      type: 'text',
      label: 'Full Name',
      name: 'name',
      required: true,
      placeholder: 'Enter your full name'
    },
    {
      id: 'email',
      type: 'email',
      label: 'Email Address',
      name: 'email',
      required: true,
      placeholder: 'your@email.com'
    },
    {
      id: 'phone',
      type: 'phone',
      label: 'Phone Number',
      name: 'phone',
      required: true,
      placeholder: '+1 (555) 123-4567'
    }
  ],
  settings: {
    title: 'Get Your Free Property Evaluation',
    submitButtonText: 'Get My Evaluation',
    successMessage: 'Thank you! We\'ll contact you within 24 hours.',
    styling: {
      theme: 'light',
      primaryColor: '#0066cc',
      borderRadius: 'md'
    }
  }
};

function PropertyEvaluationPage() {
  const handleFormSubmit = async (data: any) => {
    const response = await fetch('/api/marketing-automation?type=submit-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formId: 'property_eval_form',
        data
      })
    });
    
    return response.json();
  };

  return (
    <LeadCaptureForm 
      form={propertyEvaluationForm}
      onSubmit={handleFormSubmit}
    />
  );
}
```

### Creating a Welcome Workflow

```typescript
const welcomeWorkflow = {
  name: 'New Lead Welcome Series',
  description: 'Welcome new property evaluation leads',
  trigger: {
    type: 'form_submission',
    source: 'property_eval_form'
  },
  conditions: [
    {
      type: 'field_value',
      field: 'property_value',
      operator: 'greater_than',
      value: 300000
    }
  ],
  actions: [
    {
      id: 'welcome_email',
      type: 'send_email',
      config: {
        subject: 'Welcome to FlipStackk!',
        body: 'Thank you for requesting a property evaluation...',
        templateId: 'welcome_template'
      }
    },
    {
      id: 'followup_whatsapp',
      type: 'send_whatsapp',
      delay: 3600000, // 1 hour
      config: {
        message: 'Hi {{name}}! Thanks for your interest...',
        template: 'welcome_new_lead'
      }
    },
    {
      id: 'create_task',
      type: 'create_task',
      delay: 86400000, // 24 hours
      config: {
        title: 'Follow up with {{name}}',
        description: 'Contact lead about property evaluation',
        priority: 'high'
      }
    }
  ],
  settings: {
    allowReentry: false,
    exitOnConversion: true,
    maxExecutionsPerLead: 1
  }
};

// Register workflow
await fetch('/api/marketing-automation?type=workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(welcomeWorkflow)
});
```

### Setting Up Personalization

```typescript
const highValuePersonalization = {
  name: 'High-Value Property Sellers',
  description: 'Personalized content for sellers with properties over $500K',
  segments: ['high_value_sellers'],
  conditions: [
    {
      type: 'field_value',
      field: 'property_value',
      operator: 'greater_than',
      value: 500000
    }
  ],
  content: {
    type: 'text',
    content: 'Get a premium evaluation for your high-value property with our expert team.',
    fallback: 'Get a free property evaluation today.'
  },
  priority: 1
};

// Register personalization rule
await engine.registerPersonalizationRule(highValuePersonalization);
```

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run marketing automation tests specifically
npm test marketing-automation

# Run tests in watch mode
npm test -- --watch
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Test specific workflow
npm run test:workflow welcome_workflow
```

### Performance Tests

```bash
# Load test the API
npm run test:load -- --endpoint /api/marketing-automation --concurrent 100

# Benchmark workflow execution
npm run test:benchmark -- --workflow welcome_workflow --iterations 1000
```

## Deployment

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/marketing_automation
      - WHATSAPP_ACCESS_TOKEN=${WHATSAPP_ACCESS_TOKEN}
      - EMAIL_API_KEY=${EMAIL_API_KEY}
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=marketing_automation
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Monitoring & Maintenance

### Health Checks

The system includes built-in health checks for:
- Database connectivity
- External service availability (WhatsApp, email, SMS)
- Workflow execution status
- Queue processing health

### Logging

Structured logging with different levels:
- `error`: System errors and failures
- `warn`: Warning conditions
- `info`: General operational messages
- `debug`: Detailed debugging information

### Metrics

Key performance indicators tracked:
- Lead conversion rates
- Workflow execution times
- Email/SMS delivery rates
- System response times
- Error rates and types

## Security Considerations

### Data Protection
- GDPR/CCPA compliant data handling
- Encrypted data storage
- Secure API endpoints with authentication
- Rate limiting on public endpoints

### Access Control
- Role-based permissions
- API key management
- Webhook signature verification
- Audit logging for sensitive operations

### Privacy
- Consent management
- Data retention policies
- Right to deletion
- Data portability

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Support

For support and questions:
- Documentation: `/docs`
- Issues: GitHub Issues
- Email: support@flipstackk.com
- Community: Discord server

## License

This project is licensed under the MIT License - see the LICENSE file for details.