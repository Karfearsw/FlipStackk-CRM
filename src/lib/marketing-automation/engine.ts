import { 
  MarketingWorkflow, 
  WorkflowExecution, 
  WorkflowAction, 
  LeadBehavior,
  ActionConfig,
  CampaignMetrics,
  PersonalizationRule
} from './types';
import { storage } from '@/lib/storage';
import { WhatsAppClient } from '@/lib/whatsapp/client';
import { WHATSAPP_QUICK_TEMPLATES } from '@/app/api/whatsapp/send/route';

export class MarketingAutomationEngine {
  private workflows: Map<string, MarketingWorkflow> = new Map();
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private providers: Map<string, any> = new Map();
  private personalizationRules: Map<string, PersonalizationRule> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    const whatsappEnabled = process.env.WHATSAPP_ENABLED === 'true';
    const requiredWhatsAppEnv = [
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_BUSINESS_ACCOUNT_ID',
      'WHATSAPP_PHONE_NUMBER',
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
    ];
    const hasWhatsAppEnv = requiredWhatsAppEnv.every((k) => !!process.env[k]);

    if (whatsappEnabled && hasWhatsAppEnv) {
      this.providers.set('whatsapp', this.createWhatsAppProvider());
    }

    this.providers.set('email', this.createEmailProvider());
    this.providers.set('sms', this.createSMSProvider());
  }

  private createWhatsAppProvider() {
    return {
      type: 'whatsapp',
      send: async (config: ActionConfig, leadId: string) => {
        try {
          const lead = await storage.getLead(parseInt(leadId));
          if (!lead?.ownerPhone) {
            throw new Error('Lead has no phone number');
          }

          const client = new WhatsAppClient({
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
            businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
            phoneNumber: process.env.WHATSAPP_PHONE_NUMBER!,
            displayName: process.env.WHATSAPP_DISPLAY_NAME || 'FlipStackk CRM',
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
            webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!,
            isActive: true,
            createdAt: new Date(),
          });

          let response;
          if (config.template) {
            const templateConfig = WHATSAPP_QUICK_TEMPLATES[config.template as keyof typeof WHATSAPP_QUICK_TEMPLATES];
            if (templateConfig) {
              const templateResult = templateConfig(lead.ownerName, '', '', lead.propertyAddress);
              if ('template' in templateResult && 'templateParams' in templateResult) {
                response = await client.sendTemplateMessage(
                  lead.ownerPhone,
                  templateResult.template,
                  'en_US',
                  templateResult.templateParams || []
                );
              } else if ('interactive' in templateResult) {
                response = await client.sendInteractiveMessage(
                  lead.ownerPhone,
                  {
                    type: 'button',
                    body: { text: templateResult.interactive.body },
                    action: {
                      buttons: templateResult.interactive.buttons.map((btn: any) => ({
                        type: 'reply',
                        reply: {
                          id: btn.id,
                          title: btn.title
                        }
                      }))
                    },
                    ...(templateResult.interactive.header && { header: { type: 'text', text: templateResult.interactive.header } }),
                    ...(templateResult.interactive.footer && { footer: { text: templateResult.interactive.footer } })
                  }
                );
              }
            }
          } else {
            response = await client.sendTextMessage(lead.ownerPhone, config.message || '');
          }

          return {
            success: true,
            messageId: response?.messages?.[0]?.id || null,
            timestamp: new Date()
          };
        } catch (error) {
          throw new MarketingAutomationEngineError(
            `WhatsApp send failed: ${error}`,
            'WHATSAPP_SEND_ERROR',
            { leadId, config },
            true
          );
        }
      }
    };
  }

  private createEmailProvider() {
    return {
      type: 'email',
      send: async (config: ActionConfig, leadId: string) => {
        try {
          const lead = await storage.getLead(parseInt(leadId));
          if (!lead?.ownerEmail) {
            throw new Error('Lead has no email address');
          }

          // Mock email sending - integrate with your email provider
          console.log(`📧 Email sent to ${lead.ownerEmail}: ${config.subject}`);
          
          return {
            success: true,
            messageId: `email_${Date.now()}`,
            timestamp: new Date()
          };
        } catch (error) {
          throw new MarketingAutomationEngineError(
            `Email send failed: ${error}`,
            'EMAIL_SEND_ERROR',
            { leadId, config },
            true
          );
        }
      }
    };
  }

  private createSMSProvider() {
    return {
      type: 'sms',
      send: async (config: ActionConfig, leadId: string) => {
        try {
          const lead = await storage.getLead(parseInt(leadId));
          if (!lead?.ownerPhone) {
            throw new Error('Lead has no phone number');
          }

          // Mock SMS sending - integrate with your SMS provider
          console.log(`📱 SMS sent to ${lead.ownerPhone}: ${config.message}`);
          
          return {
            success: true,
            messageId: `sms_${Date.now()}`,
            timestamp: new Date()
          };
        } catch (error) {
          throw new MarketingAutomationEngineError(
            `SMS send failed: ${error}`,
            'SMS_SEND_ERROR',
            { leadId, config },
            true
          );
        }
      }
    };
  }

  private processTemplateParams(message: string, lead: any): any[] {
    // Process template parameters based on lead data
    return [
      { type: 'text', text: lead.name || 'Valued Customer' },
      { type: 'text', text: lead.propertyAddress || 'Your Property' },
      { type: 'text', text: 'FlipStackk Team' }
    ];
  }

  async registerWorkflow(workflow: MarketingWorkflow): Promise<void> {
    this.workflows.set(workflow.id, workflow);
    console.log(`✅ Workflow registered: ${workflow.name} (${workflow.id})`);
  }

  async triggerWorkflow(workflowId: string, leadId: string, triggerData: any = {}): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new MarketingAutomationEngineError(
        `Workflow not found: ${workflowId}`,
        'WORKFLOW_NOT_FOUND',
        { workflowId, leadId },
        false
      );
    }

    if (workflow.status !== 'active') {
      throw new MarketingAutomationEngineError(
        `Workflow is not active: ${workflowId}`,
        'WORKFLOW_INACTIVE',
        { workflowId, leadId },
        false
      );
    }

    // Check execution limits
    const executions = await this.getWorkflowExecutions(workflowId, leadId);
    if (executions.length >= workflow.settings.maxExecutionsPerLead && !workflow.settings.allowReentry) {
      throw new MarketingAutomationEngineError(
        `Maximum executions reached for lead: ${leadId}`,
        'MAX_EXECUTIONS_REACHED',
        { workflowId, leadId },
        false
      );
    }

    // Create execution record
    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      leadId,
      status: 'pending',
      currentStep: 0,
      totalSteps: workflow.actions.length,
      startedAt: new Date(),
      context: triggerData
    };

    this.activeExecutions.set(execution.id, execution);
    
    // Start execution asynchronously
    this.executeWorkflow(execution, workflow).catch(error => {
      console.error(`❌ Workflow execution failed: ${execution.id}`, error);
    });

    return execution;
  }

  private async executeWorkflow(execution: WorkflowExecution, workflow: MarketingWorkflow): Promise<void> {
    try {
      execution.status = 'running';
      
      // Check conditions
      const conditionsMet = await this.evaluateConditions(workflow.conditions, execution.leadId, execution.context);
      if (!conditionsMet) {
        execution.status = 'completed';
        execution.completedAt = new Date();
        return;
      }

      // Execute actions sequentially
      for (let i = 0; i < workflow.actions.length; i++) {
        const action = workflow.actions[i];
        execution.currentStep = i + 1;

        // Check action conditions
        const actionConditionsMet = await this.evaluateConditions(action.conditions || [], execution.leadId, execution.context);
        if (!actionConditionsMet) {
          continue;
        }

        // Handle delays
        if (action.delay && action.delay > 0) {
          await this.delay(action.delay);
        }

        // Execute action
        try {
          await this.executeAction(action, execution.leadId, execution.context);
        } catch (error) {
          if (error instanceof MarketingAutomationEngineError && !error.recoverable) {
            throw error;
          }
          console.warn(`⚠️ Action failed but continuing: ${action.id}`, error);
        }
      }

      execution.status = 'completed';
      execution.completedAt = new Date();
      
      console.log(`✅ Workflow execution completed: ${execution.id}`);
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.completedAt = new Date();
      
      console.error(`❌ Workflow execution failed: ${execution.id}`, error);
      throw error;
    }
  }

  private async evaluateConditions(conditions: any[], leadId: string, context: any): Promise<boolean> {
    if (!conditions || conditions.length === 0) return true;

    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, leadId, context);
      if (!result) return false;
    }

    return true;
  }

  private async evaluateCondition(condition: any, leadId: string, context: any): Promise<boolean> {
    const lead = await storage.getLead(parseInt(leadId));
    if (!lead) return false;

    switch (condition.type) {
      case 'field_value':
        return this.evaluateFieldCondition(condition, lead);
      case 'lead_score':
        return this.evaluateLeadScoreCondition(condition, lead);
      case 'segment':
        return this.evaluateSegmentCondition(condition, leadId);
      case 'behavior':
        return this.evaluateBehaviorCondition(condition, leadId);
      case 'time':
        return this.evaluateTimeCondition(condition);
      default:
        return true;
    }
  }

  private evaluateFieldCondition(condition: any, lead: any): boolean {
    const fieldValue = lead[condition.field];
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return String(fieldValue).includes(String(conditionValue));
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      default:
        return true;
    }
  }

  private evaluateLeadScoreCondition(condition: any, lead: any): boolean {
    const score = lead.score || 0;
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'greater_than':
        return score > conditionValue;
      case 'less_than':
        return score < conditionValue;
      case 'equals':
        return score === conditionValue;
      default:
        return true;
    }
  }

  private async evaluateSegmentCondition(condition: any, leadId: string): Promise<boolean> {
    // Mock segment evaluation - implement based on your segment logic
    return true;
  }

  private async evaluateBehaviorCondition(condition: any, leadId: string): Promise<boolean> {
    // Mock behavior evaluation - implement based on your behavior tracking
    return true;
  }

  private evaluateTimeCondition(condition: any): boolean {
    const now = new Date();
    const conditionTime = new Date(condition.value);

    switch (condition.operator) {
      case 'greater_than':
        return now > conditionTime;
      case 'less_than':
        return now < conditionTime;
      default:
        return true;
    }
  }

  private async executeAction(action: WorkflowAction, leadId: string, context: any): Promise<void> {
    switch (action.type) {
      case 'send_email':
        {
          const provider = this.providers.get('email');
          if (!provider) {
            throw new MarketingAutomationEngineError(
              `Provider not found: ${action.type}`,
              'PROVIDER_NOT_FOUND',
              { action, leadId },
              false
            );
          }
          await provider.send(action.config, leadId);
        }
        break;
      case 'send_sms':
        {
          const provider = this.providers.get('sms');
          if (!provider) {
            throw new MarketingAutomationEngineError(
              `Provider not found: ${action.type}`,
              'PROVIDER_NOT_FOUND',
              { action, leadId },
              false
            );
          }
          await provider.send(action.config, leadId);
        }
        break;
      case 'send_whatsapp':
        {
          const provider = this.providers.get('whatsapp');
          if (!provider) {
            throw new MarketingAutomationEngineError(
              `Provider not found: ${action.type}`,
              'PROVIDER_NOT_FOUND',
              { action, leadId },
              false
            );
          }
          await provider.send(action.config, leadId);
        }
        break;
      case 'add_tag':
        await this.addTags(leadId, action.config.tags || []);
        break;
      case 'remove_tag':
        await this.removeTags(leadId, action.config.tags || []);
        break;
      case 'update_field':
        await this.updateLeadField(leadId, action.config.field!, action.config.value);
        break;
      case 'wait':
        await this.delay(this.parseDuration(action.config.duration!, action.config.unit!));
        break;
      case 'webhook':
        await this.executeWebhook(action.config);
        break;
      default:
        console.warn(`⚠️ Unknown action type: ${action.type}`);
    }
  }

  private async addTags(leadId: string, tags: string[]): Promise<void> {
    // Tags functionality not implemented in current schema
    // This is a placeholder for future implementation
    console.log(`Would add tags ${tags.join(', ')} to lead ${leadId}`);
  }

  private async removeTags(leadId: string, tags: string[]): Promise<void> {
    // Tags functionality not implemented in current schema
    // This is a placeholder for future implementation
    console.log(`Would remove tags ${tags.join(', ')} from lead ${leadId}`);
  }

  private async updateLeadField(leadId: string, field: string, value: any): Promise<void> {
    await storage.updateLead(parseInt(leadId), { [field]: value });
  }

  private async executeWebhook(config: ActionConfig): Promise<void> {
    if (!config.url) return;

    try {
      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify(config.body)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }
    } catch (error) {
      throw new MarketingAutomationEngineError(
        `Webhook execution failed: ${error}`,
        'WEBHOOK_ERROR',
        { config },
        true
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private parseDuration(duration: number, unit: string): number {
    const multipliers = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000
    };
    return duration * (multipliers[unit as keyof typeof multipliers] || 1000);
  }

  private async getWorkflowExecutions(workflowId: string, leadId: string): Promise<WorkflowExecution[]> {
    const executions = Array.from(this.activeExecutions.values());
    return executions.filter(exec => 
      exec.workflowId === workflowId && 
      exec.leadId === leadId && 
      exec.status === 'completed'
    );
  }

  async trackLeadBehavior(behavior: LeadBehavior): Promise<void> {
    try {
      // Store behavior data
      await storage.createActivity({
        userId: 1, // System user ID
        actionType: behavior.type,
        targetType: 'lead',
        targetId: parseInt(behavior.leadId),
        description: `${behavior.type} from ${behavior.source}`,
        createdAt: behavior.timestamp
      });

      // Trigger behavior-based workflows
      await this.triggerBehaviorWorkflows(behavior);
    } catch (error) {
      console.error(`❌ Failed to track behavior: ${behavior.id}`, error);
    }
  }

  private async triggerBehaviorWorkflows(behavior: LeadBehavior): Promise<void> {
    // Find workflows that match this behavior
    for (const [workflowId, workflow] of this.workflows) {
      if (workflow.status === 'active' && 
          this.matchesBehaviorTrigger(workflow.trigger, behavior)) {
        try {
          await this.triggerWorkflow(workflowId, behavior.leadId, behavior.data);
        } catch (error) {
          console.warn(`⚠️ Failed to trigger workflow ${workflowId} for behavior ${behavior.id}`);
        }
      }
    }
  }

  private matchesBehaviorTrigger(trigger: any, behavior: LeadBehavior): boolean {
    return trigger.eventData?.type === behavior.type && 
           trigger.eventData?.source === behavior.source;
  }

  async getPersonalizedContent(leadId: string, contentType: string, context: any = {}): Promise<any> {
    const lead = await storage.getLead(parseInt(leadId));
    if (!lead) return null;

    // Find matching personalization rules
    const matchingRules = Array.from(this.personalizationRules.values())
      .filter(rule => rule.status === 'active')
      .sort((a, b) => b.priority - a.priority)
      .filter(rule => this.matchesPersonalizationRule(rule, lead, context));

    if (matchingRules.length === 0) return null;

    // Use the highest priority rule
    const rule = matchingRules[0];
    return this.generatePersonalizedContent(rule, lead, context);
  }

  private matchesPersonalizationRule(rule: PersonalizationRule, lead: any, context: any): boolean {
    // Implement rule matching logic based on segments, conditions, etc.
    return true; // Simplified for MVP
  }

  private generatePersonalizedContent(rule: PersonalizationRule, lead: any, context: any): any {
    // Generate personalized content based on rule and lead data
    return {
      content: rule.content.content.replace(/\{\{(\w+)\}\}/g, (match, key) => lead[key] || match),
      type: rule.content.type
    };
  }

  async registerPersonalizationRule(rule: PersonalizationRule): Promise<void> {
    this.personalizationRules.set(rule.id, rule);
  }

  async getAnalytics(period: { start: Date; end: Date }): Promise<CampaignMetrics> {
    // Mock analytics - implement based on your tracking data
    return {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      conversionRate: 0,
      cost: 0,
      revenue: 0,
      roi: 0,
      engagementRate: 0,
      unsubscribeRate: 0,
      bounceRate: 0
    };
  }
}

export class MarketingAutomationEngineError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'MarketingAutomationEngineError';
  }
}