export interface LeadCaptureForm {
  id: string;
  name: string;
  fields: FormField[];
  settings: FormSettings;
  workflows: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea' | 'date';
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: FieldValidation;
  conditions?: FieldCondition[];
}

export interface FieldValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  customMessage?: string;
}

export interface FieldCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  action: 'show' | 'hide' | 'require' | 'disable';
}

export interface FormSettings {
  title: string;
  description?: string;
  submitButtonText: string;
  successMessage: string;
  errorMessage: string;
  redirectUrl?: string;
  enableProgressiveProfiling: boolean;
  enableDoubleOptIn: boolean;
  consentText?: string;
  styling: FormStyling;
}

export interface FormStyling {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  layout: 'vertical' | 'horizontal' | 'multi-step';
  customCss?: string;
}

export interface MarketingWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  settings: WorkflowSettings;
  status: 'draft' | 'active' | 'paused' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  type: 'form_submission' | 'lead_created' | 'lead_updated' | 'email_opened' | 'link_clicked' | 'page_viewed' | 'time_based' | 'manual';
  source?: string;
  eventData?: Record<string, any>;
}

export interface WorkflowCondition {
  type: 'field_value' | 'lead_score' | 'segment' | 'behavior' | 'time' | 'custom';
  field?: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  customLogic?: string;
}

export interface WorkflowAction {
  id: string;
  type: 'send_email' | 'send_sms' | 'send_whatsapp' | 'add_tag' | 'remove_tag' | 'update_field' | 'create_task' | 'wait' | 'webhook' | 'add_to_segment' | 'remove_from_segment';
  config: ActionConfig;
  delay?: number;
  conditions?: WorkflowCondition[];
}

export interface ActionConfig {
  // Email action config
  subject?: string;
  body?: string;
  templateId?: string;
  fromName?: string;
  fromEmail?: string;
  
  // SMS/WhatsApp action config
  message?: string;
  template?: string;
  
  // Task action config
  title?: string;
  description?: string;
  assignee?: string;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  
  // Webhook action config
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  webhookBody?: any;
  
  // Wait action config
  duration?: number;
  unit?: 'minutes' | 'hours' | 'days' | 'weeks';
  
  // Field update config
  field?: string;
  value?: any;
  
  // Tag/Segment config
  tags?: string[];
  segmentId?: string;
}

export interface WorkflowSettings {
  allowReentry: boolean;
  exitOnConversion: boolean;
  maxExecutionsPerLead: number;
  executionWindow?: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface LeadBehavior {
  id: string;
  leadId: string;
  type: 'page_view' | 'email_open' | 'link_click' | 'form_submission' | 'purchase' | 'custom';
  source: string;
  data: Record<string, any>;
  timestamp: Date;
  sessionId: string;
}

export interface LeadSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria[];
  leads: string[];
  settings: SegmentSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentCriteria {
  type: 'field_value' | 'behavior' | 'engagement_score' | 'lifecycle_stage' | 'custom';
  field?: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'between';
  value: any;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface SegmentSettings {
  autoUpdate: boolean;
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  maxSize?: number;
}

export interface PersonalizationRule {
  id: string;
  name: string;
  segments: string[];
  conditions: PersonalizationCondition[];
  content: PersonalizationContent;
  priority: number;
  status: 'draft' | 'active' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalizationCondition {
  type: 'segment' | 'behavior' | 'field_value' | 'time' | 'device' | 'location';
  field?: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface PersonalizationContent {
  type: 'text' | 'image' | 'video' | 'html' | 'component';
  content: string;
  variants?: PersonalizationVariant[];
  fallback?: string;
}

export interface PersonalizationVariant {
  id: string;
  name: string;
  weight: number;
  content: string;
  conditions?: PersonalizationCondition[];
}

export interface CampaignAnalytics {
  id: string;
  campaignId: string;
  metrics: CampaignMetrics;
  period: {
    start: Date;
    end: Date;
  };
  createdAt: Date;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  cost: number;
  revenue: number;
  roi: number;
  engagementRate: number;
  unsubscribeRate: number;
  bounceRate: number;
  openRate?: number;
  clickThroughRate?: number;
}

export interface MarketingProvider {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp' | 'push' | 'webhook';
  config: ProviderConfig;
  status: 'active' | 'inactive';
  settings: ProviderSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderConfig {
  apiKey: string;
  apiSecret?: string;
  endpoint?: string;
  region?: string;
  additionalConfig?: Record<string, any>;
}

export interface ProviderSettings {
  rateLimit: number;
  retryAttempts: number;
  timeout: number;
  enableTracking: boolean;
  enableWebhook: boolean;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  headers: Record<string, string>;
  retryPolicy: RetryPolicy;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: 'integration' | 'workflow_action' | 'condition' | 'analytics' | 'ui_component';
  hooks: PluginHook[];
  permissions: string[];
  config: PluginConfig;
  dependencies: string[];
}

export interface PluginHook {
  name: string;
  description: string;
  parameters: HookParameter[];
  returnType: string;
}

export interface HookParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: any;
}

export interface PluginConfig {
  schema: any;
  defaults: Record<string, any>;
  validation: any;
}

export interface MarketingAutomationError extends Error {
  code: string;
  context?: Record<string, any>;
  recoverable: boolean;
}

export interface LeadCaptureResult {
  success: boolean;
  leadId?: string;
  errors?: ValidationError[];
  workflowExecutions?: string[];
  confirmationMessage?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  leadId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  context: Record<string, any>;
}