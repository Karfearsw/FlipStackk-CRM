// Marketing automation types for client-side usage
export interface MarketingWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  triggerType: string;
  triggerSource?: string;
  triggerEventData?: any;
  conditions?: any[];
  actions: Array<{
    id: string;
    type: string;
    config: any;
    delay?: number;
    conditions?: any[];
  }>;
  settings: {
    allowReentry: boolean;
    exitOnConversion: boolean;
    maxExecutionsPerLead: number;
    executionWindow?: {
      start: string;
      end: string;
      timezone: string;
    };
  };
  createdByUserId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingForm {
  id: string;
  name: string;
  title: string;
  description?: string;
  fields: Array<{
    id: string;
    type: string;
    label: string;
    name: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
    validation?: {
      pattern?: string;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      customMessage?: string;
    };
  }>;
  settings: {
    title: string;
    description?: string;
    submitButtonText: string;
    successMessage: string;
    errorMessage: string;
    redirectUrl?: string;
    enableProgressiveProfiling: boolean;
    enableDoubleOptIn: boolean;
    consentText?: string;
    styling: {
      theme: 'light' | 'dark' | 'auto';
      primaryColor: string;
      borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
      layout: 'vertical' | 'horizontal' | 'multi-step';
      customCss?: string;
    };
  };
  workflows: string[];
  createdByUserId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingExecution {
  id: string;
  workflowId: string;
  leadId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  executionData?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingMessage {
  id: string;
  executionId?: string;
  leadId?: string;
  messageType: 'email' | 'sms' | 'whatsapp' | 'push';
  subject?: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingAnalytics {
  id: string;
  metricType: 'workflow_execution' | 'form_submission' | 'email_sent' | 'email_opened' | 'email_clicked' | 'sms_sent' | 'whatsapp_sent' | 'whatsapp_delivered' | 'whatsapp_read' | 'conversion';
  metricValue: number;
  workflowId?: string;
  formId?: string;
  leadId?: string;
  executionId?: string;
  messageId?: string;
  campaignId?: string;
  source?: string;
  metadata?: any;
  createdAt: Date;
}

export interface AutomationStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalLeads: number;
  convertedLeads: number;
  emailSent: number;
  whatsappSent: number;
  avgConversionRate: number;
}