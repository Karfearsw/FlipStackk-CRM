-- Marketing Automation Tables

-- Marketing workflows table
CREATE TABLE IF NOT EXISTS marketing_workflows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'draft')),
    trigger_type VARCHAR(100) NOT NULL,
    trigger_source VARCHAR(255),
    trigger_event_data JSONB,
    conditions JSONB,
    actions JSONB NOT NULL,
    settings JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id INTEGER REFERENCES users(id)
);

-- Lead capture forms table
CREATE TABLE IF NOT EXISTS marketing_forms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    submit_button_text VARCHAR(100) NOT NULL DEFAULT 'Submit',
    success_message TEXT NOT NULL,
    error_message TEXT NOT NULL DEFAULT 'Something went wrong. Please try again.',
    redirect_url VARCHAR(500),
    enable_progressive_profiling BOOLEAN DEFAULT false,
    enable_double_opt_in BOOLEAN DEFAULT false,
    consent_text TEXT,
    styling JSONB DEFAULT '{"theme": "light", "primaryColor": "#0066cc", "borderRadius": "md", "layout": "vertical"}',
    fields JSONB NOT NULL,
    workflows INTEGER[], -- Array of workflow IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id INTEGER REFERENCES users(id)
);

-- Marketing campaign analytics table
CREATE TABLE IF NOT EXISTS marketing_analytics (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES marketing_workflows(id),
    form_id INTEGER REFERENCES marketing_forms(id),
    metric_type VARCHAR(100) NOT NULL, -- 'workflow_execution', 'form_submission', 'email_sent', 'whatsapp_sent', 'conversion'
    metric_value INTEGER NOT NULL DEFAULT 1,
    lead_id INTEGER REFERENCES leads(id),
    campaign_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marketing workflow executions table
CREATE TABLE IF NOT EXISTS marketing_executions (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES marketing_workflows(id),
    lead_id INTEGER REFERENCES leads(id),
    status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    current_step INTEGER DEFAULT 0,
    execution_data JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

-- Marketing messages table (for tracking individual messages)
CREATE TABLE IF NOT EXISTS marketing_messages (
    id SERIAL PRIMARY KEY,
    execution_id INTEGER REFERENCES marketing_executions(id),
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('email', 'whatsapp', 'sms')),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    provider_message_id VARCHAR(255),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample workflow data
INSERT INTO marketing_workflows (name, description, status, trigger_type, trigger_source, trigger_event_data, conditions, actions, settings, created_by_user_id) VALUES
('New Lead Welcome Series', 'Automated welcome sequence for new property evaluation leads', 'active', 'form_submission', 'property_evaluation_form', '{}', '[]', '[
  {
    "id": "action_1",
    "type": "send_email",
    "config": {
      "subject": "Welcome to FlipStackk!",
      "body": "Thank you for requesting a property evaluation. Our team will contact you within 24 hours.",
      "fromName": "FlipStackk Team",
      "fromEmail": "noreply@flipstackk.com"
    }
  },
  {
    "id": "action_2", 
    "type": "send_whatsapp",
    "delay": 3600000,
    "config": {
      "message": "Hi {{name}}! Thanks for your interest in our property evaluation. We will be in touch soon!",
      "template": "welcome_new_lead"
    }
  },
  {
    "id": "action_3",
    "type": "create_task", 
    "delay": 86400000,
    "config": {
      "title": "Follow up with new lead {{name}}",
      "description": "Contact lead about property evaluation request",
      "priority": "high",
      "dueDate": "2024-11-18"
    }
  }
]', '{"allowReentry": false, "exitOnConversion": true, "maxExecutionsPerLead": 1}', 1),

('WhatsApp Follow-up Sequence', 'Follow-up messages for WhatsApp inquiries', 'active', 'whatsapp_message_received', 'whatsapp_webhook', '{}', '[
  {
    "type": "field_value",
    "field": "message",
    "operator": "contains",
    "value": "interested"
  }
]', '[
  {
    "id": "action_1",
    "type": "send_whatsapp",
    "config": {
      "message": "Thank you for your interest! A specialist will contact you within 2 hours.",
      "template": "auto_response_interested"
    }
  },
  {
    "id": "action_2",
    "type": "send_email",
    "delay": 7200000,
    "config": {
      "subject": "Your Property Inquiry - Next Steps",
      "body": "Hi {{name}}, I saw your WhatsApp message about property services. Here are the next steps...",
      "fromName": "Property Specialist"
    }
  }
]', '{"allowReentry": true, "exitOnConversion": false, "maxExecutionsPerLead": 3}', 1),

('Lead Nurture Campaign', 'Long-term nurture sequence for leads', 'paused', 'lead_created', 'manual', '{}', '[]', '[
  {
    "id": "action_1",
    "type": "send_email",
    "delay": 259200000,
    "config": {
      "subject": "Market Update - Property Values in Your Area",
      "body": "Hi {{name}}, here is the latest market update for properties in your area...",
      "fromName": "Market Analyst"
    }
  },
  {
    "id": "action_2",
    "type": "send_whatsapp",
    "delay": 604800000,
    "config": {
      "message": "Hi {{name}}, would you like a free property valuation update?",
      "template": "nurture_followup"
    }
  }
]', '{"allowReentry": false, "exitOnConversion": true, "maxExecutionsPerLead": 1}', 1);

-- Insert sample form data
INSERT INTO marketing_forms (name, title, description, submit_button_text, success_message, fields, workflows, created_by_user_id) VALUES
('Property Evaluation Form', 'Get Your Free Property Evaluation', 'Fill out this form to receive a comprehensive evaluation of your property value.', 'Get My Evaluation', 'Thank you! We will contact you within 24 hours with your property evaluation.', '[
  {
    "id": "field_1",
    "type": "text",
    "label": "Full Name",
    "name": "name",
    "required": true,
    "placeholder": "Enter your full name"
  },
  {
    "id": "field_2", 
    "type": "email",
    "label": "Email Address",
    "name": "email",
    "required": true,
    "placeholder": "your@email.com"
  },
  {
    "id": "field_3",
    "type": "phone", 
    "label": "Phone Number",
    "name": "phone",
    "required": true,
    "placeholder": "+1 (555) 123-4567"
  },
  {
    "id": "field_4",
    "type": "text",
    "label": "Property Address", 
    "name": "propertyAddress",
    "required": true,
    "placeholder": "123 Main St, City, State"
  }
]', '{1}', 1),

('Quick Contact Form', 'Quick Property Inquiry', 'Have a quick question about your property? Ask us anything!', 'Send Message', 'Thank you for your message! We will get back to you shortly.', '[
  {
    "id": "field_1",
    "type": "text",
    "label": "Name",
    "name": "name",
    "required": true,
    "placeholder": "Your name"
  },
  {
    "id": "field_2",
    "type": "email",
    "label": "Email",
    "name": "email",
    "required": true,
    "placeholder": "your.email@example.com"
  },
  {
    "id": "field_3",
    "type": "textarea",
    "label": "Message",
    "name": "message",
    "required": true,
    "placeholder": "Tell us about your property or question..."
  }
]', '{2}', 1);

-- Insert sample analytics data (using NULL for lead_id to avoid FK constraints)
INSERT INTO marketing_analytics (workflow_id, form_id, metric_type, metric_value, lead_id, campaign_data) VALUES
(1, 1, 'workflow_execution', 1, NULL, '{"source": "form_submission", "trigger": "property_evaluation_form"}'),
(1, 1, 'form_submission', 1, NULL, '{"form": "Property Evaluation Form", "conversion": true}'),
(1, null, 'email_sent', 15, NULL, '{"template": "welcome_email", "status": "sent", "count": 15}'),
(1, null, 'whatsapp_sent', 12, NULL, '{"template": "welcome_new_lead", "status": "delivered", "count": 12}'),
(2, null, 'workflow_execution', 1, NULL, '{"source": "whatsapp_message", "trigger": "interested_keyword"}'),
(2, null, 'whatsapp_sent', 8, NULL, '{"template": "auto_response_interested", "status": "delivered", "count": 8}'),
(null, 2, 'form_submission', 1, NULL, '{"form": "Quick Contact Form", "conversion": false}');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketing_workflows_status ON marketing_workflows(status);
CREATE INDEX IF NOT EXISTS idx_marketing_workflows_trigger ON marketing_workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_marketing_forms_created_by ON marketing_forms(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_analytics_workflow ON marketing_analytics(workflow_id);
CREATE INDEX IF NOT EXISTS idx_marketing_analytics_form ON marketing_analytics(form_id);
CREATE INDEX IF NOT EXISTS idx_marketing_analytics_metric ON marketing_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_marketing_executions_workflow ON marketing_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_marketing_executions_lead ON marketing_executions(lead_id);
CREATE INDEX IF NOT EXISTS idx_marketing_executions_status ON marketing_executions(status);
CREATE INDEX IF NOT EXISTS idx_marketing_messages_execution ON marketing_messages(execution_id);
CREATE INDEX IF NOT EXISTS idx_marketing_messages_status ON marketing_messages(status);