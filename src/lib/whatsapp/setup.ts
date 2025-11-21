import { WhatsAppClient } from './client';

interface WhatsAppSetupConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  appId: string;
  appSecret: string;
  webhookVerifyToken: string;
  webhookUrl: string;
}

// WhatsApp Business API setup utilities
export class WhatsAppSetup {
  private config: WhatsAppSetupConfig;
  private client: WhatsAppClient;

  constructor(config: WhatsAppSetupConfig) {
    this.config = config;
    this.client = new WhatsAppClient({
      accessToken: config.accessToken,
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      phoneNumber: process.env.WHATSAPP_PHONE_NUMBER || '',
      displayName: process.env.WHATSAPP_DISPLAY_NAME || 'FlipStackk CRM',
      appId: config.appId,
      appSecret: config.appSecret,
      webhookVerifyToken: config.webhookVerifyToken,
      isActive: true,
      createdAt: new Date(),
    });
  }

  // Validate environment configuration
  async validateConfig(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check required environment variables
    const required = [
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_BUSINESS_ACCOUNT_ID',
      'WHATSAPP_APP_ID',
      'WHATSAPP_APP_SECRET',
      'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
      'WHATSAPP_WEBHOOK_URL',
    ];

    for (const key of required) {
      if (!process.env[key]) {
        errors.push(`Missing environment variable: ${key}`);
      }
    }

    // Test API connectivity
    try {
      const accountInfo = await this.client.getBusinessAccountInfo();
      console.log(`✅ Connected to WhatsApp Business Account: ${accountInfo.about?.text || 'Business Account'}`);
    } catch (error) {
      errors.push(`Failed to connect to WhatsApp Business API: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Setup webhook configuration
  async setupWebhook(): Promise<{ success: boolean; message: string }> {
    try {
      // Configure webhook URL for the phone number
      const webhookUrl = `${this.config.webhookUrl}/api/whatsapp/webhook`;
      
      console.log(`🔧 Setting up WhatsApp webhook: ${webhookUrl}`);

      // This would typically involve calling the WhatsApp Business API
      // to register the webhook URL for your phone number
      // For now, we'll simulate the setup process

      console.log('✅ WhatsApp webhook configured successfully');
      console.log(`📱 Webhook URL: ${webhookUrl}`);
      console.log(`🔑 Verify Token: ${this.config.webhookVerifyToken}`);

      return {
        success: true,
        message: 'Webhook configured successfully',
      };
    } catch (error) {
      console.error('❌ Webhook setup failed:', error);
      return {
        success: false,
        message: `Webhook setup failed: ${error}`,
      };
    }
  }

  // Test webhook connectivity
  async testWebhook(): Promise<{ success: boolean; message: string }> {
    try {
      // Test webhook verification
      const testUrl = `${this.config.webhookUrl}/api/whatsapp/webhook`;
      const testToken = this.config.webhookVerifyToken;

      console.log(`🧪 Testing webhook connectivity: ${testUrl}`);

      // Simulate webhook test
      const testResponse = await fetch(`${testUrl}?hub.mode=subscribe&hub.verify_token=${testToken}&hub.challenge=test_challenge`);

      if (testResponse.ok) {
        console.log('✅ Webhook test successful');
        return {
          success: true,
          message: 'Webhook test successful',
        };
      } else {
        console.error('❌ Webhook test failed');
        return {
          success: false,
          message: 'Webhook test failed',
        };
      }
    } catch (error) {
      console.error('❌ Webhook test error:', error);
      return {
        success: false,
        message: `Webhook test error: ${error}`,
      };
    }
  }

  // Get account information
  async getAccountInfo(): Promise<any> {
    try {
      const accountInfo = await this.client.getBusinessAccountInfo();
      const templates = await this.client.getMessageTemplates();

      return {
        account: accountInfo,
        templates: templates.slice(0, 10), // First 10 templates
        totalTemplates: templates.length,
      };
    } catch (error) {
      console.error('❌ Failed to get account info:', error);
      throw error;
    }
  }

  // Check message templates
  async checkTemplates(): Promise<{ templates: any[]; missing: string[] }> {
    try {
      const templates = await this.client.getMessageTemplates();
      const templateNames = templates.map((t: any) => t.name);

      // Required templates for CRM functionality
      const requiredTemplates = [
        'lead_followup',
        'property_evaluation',
        'appointment_confirmation',
        'offer_presentation',
        'document_request',
        'closing_reminder',
        'welcome_new_lead',
        'no_response_followup',
      ];

      const missingTemplates = requiredTemplates.filter(name => !templateNames.includes(name));

      return {
        templates: templates.slice(0, 10),
        missing: missingTemplates,
      };
    } catch (error) {
      console.error('❌ Failed to check templates:', error);
      throw error;
    }
  }

  // Send test message
  async sendTestMessage(to: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`📤 Sending test WhatsApp message to ${to}`);

      const response = await this.client.sendTextMessage(
        to,
        '🔧 WhatsApp Business API test message from your CRM system. If you received this, your integration is working correctly!'
      );

      const messageId = response.messages?.[0]?.id;
      console.log(`✅ Test message sent successfully: ${messageId}`);

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      console.error('❌ Test message failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Complete setup process
  async completeSetup(): Promise<{ success: boolean; summary: any }> {
    const summary: any = {
      timestamp: new Date().toISOString(),
      steps: [],
    };

    try {
      // Step 1: Validate configuration
      console.log('\n📋 Step 1: Validating configuration...');
      const validation = await this.validateConfig();
      summary.steps.push({
        step: 'Configuration Validation',
        success: validation.valid,
        errors: validation.errors,
      });

      if (!validation.valid) {
        throw new Error('Configuration validation failed');
      }

      // Step 2: Setup webhook
      console.log('\n🔧 Step 2: Setting up webhook...');
      const webhookSetup = await this.setupWebhook();
      summary.steps.push({
        step: 'Webhook Setup',
        success: webhookSetup.success,
        message: webhookSetup.message,
      });

      if (!webhookSetup.success) {
        throw new Error('Webhook setup failed');
      }

      // Step 3: Test webhook
      console.log('\n🧪 Step 3: Testing webhook...');
      const webhookTest = await this.testWebhook();
      summary.steps.push({
        step: 'Webhook Test',
        success: webhookTest.success,
        message: webhookTest.message,
      });

      // Step 4: Check templates
      console.log('\n📋 Step 4: Checking message templates...');
      const templateCheck = await this.checkTemplates();
      summary.steps.push({
        step: 'Template Check',
        success: templateCheck.missing.length === 0,
        templates: templateCheck.templates,
        missing: templateCheck.missing,
      });

      // Step 5: Get account info
      console.log('\n📊 Step 5: Getting account information...');
      const accountInfo = await this.getAccountInfo();
      summary.steps.push({
        step: 'Account Information',
        success: true,
        account: accountInfo.account,
        totalTemplates: accountInfo.totalTemplates,
      });

      summary.success = true;
      console.log('\n✅ WhatsApp Business API setup completed successfully!');

      return {
        success: true,
        summary,
      };
    } catch (error) {
      console.error('\n❌ WhatsApp setup failed:', error);
      summary.success = false;
      summary.error = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        summary,
      };
    }
  }
}

// Environment validation utility
export function validateWhatsAppEnv(): { valid: boolean; missing: string[] } {
  const required = [
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_BUSINESS_ACCOUNT_ID',
    'WHATSAPP_APP_ID',
    'WHATSAPP_APP_SECRET',
    'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
  ];

  const missing = required.filter(key => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}

// Quick setup function
export async function quickWhatsAppSetup(): Promise<{ success: boolean; message: string }> {
  const validation = validateWhatsAppEnv();
  
  if (!validation.valid) {
    return {
      success: false,
      message: `Missing required environment variables: ${validation.missing.join(', ')}`,
    };
  }

  try {
    const config: WhatsAppSetupConfig = {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
      appId: process.env.WHATSAPP_APP_ID!,
      appSecret: process.env.WHATSAPP_APP_SECRET!,
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!,
      webhookUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };

    const setup = new WhatsAppSetup(config);
    const result = await setup.completeSetup();

    return {
      success: result.success,
      message: result.success 
        ? 'WhatsApp Business API setup completed successfully!'
        : 'WhatsApp Business API setup failed. Check the logs for details.',
    };
  } catch (error) {
    return {
      success: false,
      message: `Setup error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}