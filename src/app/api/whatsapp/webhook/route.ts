import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppClient } from '@/lib/whatsapp/client';
import { WhatsAppWebhookPayload, WhatsAppIncomingMessage, WhatsAppMessageStatus } from '@/lib/whatsapp/types';
import { WhatsAppCompliance } from '@/lib/whatsapp/templates';
import { storage, whatsappStorage } from '@/lib/storage';
import crypto from 'crypto';

// Environment variable validation
function validateWhatsAppEnvironment(): { valid: boolean; missing: string[] } {
  const requiredEnvVars = [
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_BUSINESS_ACCOUNT_ID',
    'WHATSAPP_PHONE_NUMBER',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
    'WHATSAPP_APP_SECRET'
  ];
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

// Initialize environment validation
const envValidation = validateWhatsAppEnvironment();
if (!envValidation.valid) {
  console.warn(`⚠️ WhatsApp environment not fully configured. Missing: ${envValidation.missing.join(', ')}`);
}

// WhatsApp webhook verification
function verifyWhatsAppWebhook(
  mode: string | null,
  token: string | null,
  challenge: string | null,
  verifyToken: string
): { verified: boolean; challenge?: string } {
  if (mode === 'subscribe' && token === verifyToken) {
    return { verified: true, challenge: challenge || '' };
  }
  return { verified: false };
}

// Structured error logging
function logStructuredError(
  error: Error | unknown,
  context: {
    operation: string;
    leadId?: number;
    phoneNumber?: string;
    messageId?: string;
    workflowId?: string;
    [key: string]: any;
  }
): void {
  const errorLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    operation: context.operation,
    error: {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    },
    context: {
      ...context,
      leadId: context.leadId,
      phoneNumber: context.phoneNumber ? WhatsAppCompliance.formatPhoneNumber(context.phoneNumber).slice(-4) : undefined,
      messageId: context.messageId,
      workflowId: context.workflowId
    },
    environment: process.env.NODE_ENV || 'development'
  };
  
  console.error(JSON.stringify(errorLog));
  
  // In production, you would also send to error tracking service
  // e.g., Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    // Sentry.captureException(error, { extra: context });
  }
}

// Enhanced data validation for WhatsApp messages
function validateWhatsAppMessage(message: WhatsAppIncomingMessage): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!message.id) {
    errors.push('Message ID is required');
  }
  
  if (!message.from) {
    errors.push('Sender phone number is required');
  } else if (!/^\+?[1-9]\d{1,14}$/.test(message.from)) {
    errors.push('Invalid phone number format');
  }
  
  if (!message.timestamp) {
    errors.push('Message timestamp is required');
  } else if (isNaN(parseInt(message.timestamp))) {
    errors.push('Invalid timestamp format');
  }
  
  // Validate message content
  if (message.text && !message.text.body) {
    errors.push('Text message body is required');
  }
  
  if (message.interactive) {
    if (!message.interactive.button_reply && !message.interactive.list_reply) {
      errors.push('Interactive message must have button_reply or list_reply');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Compliance and consent management
async function checkMarketingCompliance(phoneNumber: string): Promise<{
  canContact: boolean;
  reason: string;
  requiresOptIn: boolean;
}> {
  try {
    // Check if phone number is on any do-not-contact lists
    const formattedPhone = WhatsAppCompliance.formatPhoneNumber(phoneNumber);
    
    // Check opt-in status
    const hasOptIn = WhatsAppCompliance.hasOptIn(phoneNumber);
    
    // Check if already opted out
    const contact = await whatsappStorage.getWhatsAppContact(formattedPhone);
    if (contact && !contact.optInStatus) {
      return {
        canContact: false,
        reason: 'User has opted out',
        requiresOptIn: false
      };
    }
    
    // Check business hours (9 AM - 9 PM local time)
    const now = new Date();
    const hour = now.getHours();
    if (hour < 9 || hour > 21) {
      return {
        canContact: false,
        reason: 'Outside business hours',
        requiresOptIn: false
      };
    }
    
    return {
      canContact: hasOptIn,
      reason: hasOptIn ? 'Valid opt-in exists' : 'No opt-in found',
      requiresOptIn: !hasOptIn
    };
  } catch (error) {
    console.error('❌ Error checking marketing compliance:', error);
    return {
      canContact: false,
      reason: 'Compliance check failed',
      requiresOptIn: true
    };
  }
}

// Process incoming WhatsApp message
async function processIncomingMessage(message: WhatsAppIncomingMessage, phoneNumberId: string) {
  const messageId = message.id;
  const from = message.from;
  const timestamp = new Date(parseInt(message.timestamp) * 1000);
  
  try {
    // Validate message structure
    const validation = validateWhatsAppMessage(message);
    if (!validation.valid) {
      logStructuredError(
        new Error('Message validation failed'),
        {
          operation: 'validate_message',
          phoneNumber: from,
          messageId,
          errors: validation.errors
        }
      );
      return;
    }

    // Handle interactive replies first
    if (message.interactive) {
      await handleInteractiveReply(message, phoneNumberId);
      return;
    }

    // Handle regular text messages
    const messageText = message.text?.body || '';
    console.log(`📱 WhatsApp message from ${from}: ${messageText}`);

    // Validate phone number format
    if (!WhatsAppCompliance.validatePhoneNumber(from)) {
      logStructuredError(
        new Error('Invalid phone number format'),
        {
          operation: 'validate_phone_number',
          phoneNumber: from,
          messageId
        }
      );
      return;
    }

    // Check marketing compliance
    const compliance = await checkMarketingCompliance(from);
    if (!compliance.canContact) {
      logStructuredError(
        new Error(compliance.reason),
        {
          operation: 'check_compliance',
          phoneNumber: from,
          messageId,
          reason: compliance.reason
        }
      );
      
      if (compliance.requiresOptIn) {
        await sendOptInRequest(from, phoneNumberId);
      }
      return;
    }

    // Find lead by phone number
    const lead = await findLeadByPhone(from);
    
    if (!lead) {
      // Create new lead from WhatsApp message
      await createLeadFromWhatsApp(from, messageText, messageId);
    } else {
      // Update existing lead communication
      await updateLeadCommunication(lead.id, from, messageText, messageId);
    }

    // Mark message as read
    const client = new WhatsAppClient({
      phoneNumberId: phoneNumberId,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
      phoneNumber: process.env.WHATSAPP_PHONE_NUMBER!,
      displayName: process.env.WHATSAPP_DISPLAY_NAME || 'FlipStackk CRM',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!,
      isActive: true,
      createdAt: new Date(),
    });

    // Note: WhatsApp doesn't have a direct markMessageAsRead method
    // This would be implemented by sending a read receipt status update
    console.log(`📖 Marked message ${messageId} as read`);

  } catch (error) {
    logStructuredError(error, {
      operation: 'process_incoming_message',
      phoneNumber: from,
      messageId
    });
  }
}

// Process message status updates (delivered, read, failed, etc.)
async function processMessageStatus(status: WhatsAppMessageStatus) {
  try {
    const { id: wamId, status: messageStatus, timestamp } = status;
    
    console.log(`📊 WhatsApp message status update: ${wamId} -> ${messageStatus}`);
    
    // Find the communication record by WhatsApp message ID
    const communications = await storage.getCommunications({
      providerMessageId: wamId,
      limit: 1
    });
    
    if (communications.length === 0) {
      console.warn(`⚠️ No communication found for WhatsApp message ID: ${wamId}`);
      return;
    }
    
    const communication = communications[0];
    const statusTimestamp = new Date(parseInt(timestamp) * 1000);
    
    // Update communication status based on WhatsApp status
    let updatedStatus = communication.status;
    let updateData: any = {};
    
    switch (messageStatus) {
      case 'delivered':
        updatedStatus = 'delivered';
        updateData = {
          status: 'delivered',
          deliveredAt: statusTimestamp,
          updatedAt: new Date()
        };
        break;
      case 'read':
        updatedStatus = 'read';
        updateData = {
          status: 'read',
          readAt: statusTimestamp,
          updatedAt: new Date()
        };
        break;
      case 'failed':
        updatedStatus = 'failed';
        updateData = {
          status: 'failed',
          failedAt: statusTimestamp,
          errorCode: status.error?.code?.toString(),
          errorTitle: status.error?.title,
          errorDetails: status.error?.message || status.error?.error_data?.details,
          updatedAt: new Date()
        };
        break;
      case 'sent':
        updatedStatus = 'sent';
        updateData = {
          status: 'sent',
          sentAt: statusTimestamp,
          updatedAt: new Date()
        };
        break;
      default:
        console.log(`ℹ️ Unknown WhatsApp status: ${messageStatus}`);
        return;
    }
    
    // Update the communication record
    await storage.updateCommunication(communication.id, updateData);
    
    console.log(`✅ Updated communication ${communication.id} status to ${updatedStatus}`);
    
    // Trigger notifications or workflows based on status
    if (messageStatus === 'read') {
      // Message was read by recipient
      await triggerMessageReadNotification(communication);
    } else if (messageStatus === 'failed') {
      // Message failed to deliver
      await triggerMessageFailedNotification(communication, status.error);
    }
    
  } catch (error) {
    console.error('❌ Error processing message status:', error);
  }
}

// Trigger notification when message is read
async function triggerMessageReadNotification(communication: any) {
  try {
    console.log(`📖 Message ${communication.id} was read by recipient`);
    
    // This could trigger:
    // - In-app notification
    // - Email notification
    // - Update UI in real-time
    // - Trigger follow-up workflows
    
  } catch (error) {
    console.error('❌ Error triggering read notification:', error);
  }
}

// Trigger notification when message fails
async function triggerMessageFailedNotification(communication: any, error: any) {
  try {
    console.log(`❌ Message ${communication.id} failed to deliver:`, error);
    
    // This could trigger:
    // - Alert admin/user about failed message
    // - Retry logic
    // - Alternative communication method
    // - Update lead status
    
  } catch (error) {
    console.error('❌ Error triggering failed notification:', error);
  }
}

// Handle interactive replies (button clicks, list selections)
async function handleInteractiveReply(message: WhatsAppIncomingMessage, phoneNumberId: string) {
  try {
    const from = message.from;
    const messageId = message.id;
    const timestamp = new Date(parseInt(message.timestamp) * 1000);
    
    let buttonId: string | undefined;
    let buttonTitle: string | undefined;
    
    if (message.interactive?.button_reply) {
      buttonId = message.interactive.button_reply.id;
      buttonTitle = message.interactive.button_reply.title;
    } else if (message.interactive?.list_reply) {
      buttonId = message.interactive.list_reply.id;
      buttonTitle = message.interactive.list_reply.title;
    }
    
    if (!buttonId) {
      console.warn('⚠️ Interactive message without button ID');
      return;
    }
    
    console.log(`🎯 WhatsApp interactive reply from ${from}: ${buttonId} - ${buttonTitle}`);
    
    // Find lead by phone number
    const lead = await findLeadByPhone(from);
    if (!lead) {
      console.warn(`⚠️ No lead found for phone ${from}`);
      return;
    }
    
    // Handle different button actions
    switch (buttonId) {
      case 'get_offer':
        await handleGetOfferAction(lead, from);
        break;
      case 'evaluation':
        await handleEvaluationAction(lead, from);
        break;
      case 'questions':
        await handleQuestionsAction(lead, from);
        break;
      case 'yes': // Opt-in confirmation
        await handleOptInConfirmation(lead, from);
        break;
      case 'stop': // Opt-out
        await handleOptOut(lead, from);
        break;
      default:
        console.log(`ℹ️ Unknown button action: ${buttonId}`);
        // Send acknowledgment
        await sendButtonAcknowledgment(from, buttonTitle || buttonId);
    }
    
    // Create communication record for the interactive reply
    await storage.createCommunication({
      leadId: lead.id,
      type: 'whatsapp',
      direction: 'inbound',
      body: `Interactive reply: ${buttonTitle || buttonId}`,
      from: from,
      to: 'CRM',
      status: 'received',
      providerMessageId: messageId,
      createdByUserId: 1 // System user
    });
    
  } catch (error) {
    console.error('❌ Error handling interactive reply:', error);
  }
}

// Handle "Get Cash Offer" button action
async function handleGetOfferAction(lead: any, phoneNumber: string) {
  try {
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
    
    // Send response with next steps
    await client.sendTextMessage(phoneNumber, 
      `Great! Let's get you a cash offer for your property. ` +
      `Please provide the property address so we can schedule a quick evaluation. ` +
      `Reply with the full address or type "HELP" for assistance.`
    );
    
    // Trigger marketing automation workflow
    await triggerMarketingAutomation(lead.id, 'get_offer_initiated');
    
    console.log(`✅ Sent get offer response to ${phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Error handling get offer action:', error);
  }
}

// Handle "Property Evaluation" button action
async function handleEvaluationAction(lead: any, phoneNumber: string) {
  try {
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
    
    // Send evaluation form or questions
    await client.sendInteractiveMessage(phoneNumber, {
      type: 'button',
      body: { text: 'Perfect! To provide an accurate evaluation, we need some details about your property:' },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'single_family', title: 'Single Family' } },
          { type: 'reply', reply: { id: 'condo', title: 'Condo' } },
          { type: 'reply', reply: { id: 'multi_family', title: 'Multi-Family' } }
        ]
      },
      header: { type: 'text', text: 'Property Type?' },
      footer: { text: 'Select the property type to continue' }
    });
    
    // Trigger marketing automation workflow
    await triggerMarketingAutomation(lead.id, 'evaluation_initiated');
    
    console.log(`✅ Sent evaluation response to ${phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Error handling evaluation action:', error);
  }
}

// Handle "General Questions" button action
async function handleQuestionsAction(lead: any, phoneNumber: string) {
  try {
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
    
    // Send helpful information
    await client.sendTextMessage(phoneNumber, 
      `We're here to help! Here are some common questions we can answer:\n\n` +
      `• How does the cash offer process work?\n` +
      `• What types of properties do you buy?\n` +
      `• How quickly can you close?\n` +
      `• Do you buy properties in any condition?\n\n` +
      `What would you like to know? Just ask!`
    );
    
    // Trigger marketing automation workflow
    await triggerMarketingAutomation(lead.id, 'questions_initiated');
    
    console.log(`✅ Sent questions response to ${phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Error handling questions action:', error);
  }
}

// Handle opt-in confirmation
async function handleOptInConfirmation(lead: any, phoneNumber: string) {
  try {
    // Update WhatsApp contact opt-in status
    const formattedPhone = WhatsAppCompliance.formatPhoneNumber(phoneNumber);
    
    // Find existing contact
    const contact = await whatsappStorage.getWhatsAppContact(formattedPhone);
    
    if (contact) {
      // Update existing contact
      await storage.updateWhatsAppContact(contact.id, {
        optIn: false,
        optOutAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Updated WhatsApp contact opt-out status for ${formattedPhone}`);
    } else {
      // Create new contact would require additional methods
      console.log(`No WhatsApp contact found for ${formattedPhone}, would create new one`);
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
    
    // Send welcome message
    await client.sendTextMessage(phoneNumber, 
      `Thank you for opting in! 🎉 You can now receive property-related messages. ` +
      `Reply STOP at any time to opt out. How can we help you today?`
    );
    
    console.log(`✅ Processed opt-in confirmation for ${phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Error handling opt-in confirmation:', error);
  }
}

// Handle opt-out
async function handleOptOut(lead: any, phoneNumber: string) {
  try {
    // Update WhatsApp contact opt-out status
    const formattedPhone = WhatsAppCompliance.formatPhoneNumber(phoneNumber);
    
    // Find existing contact
    const contact = await whatsappStorage.getWhatsAppContact(formattedPhone);
    
    if (contact) {
      // Update existing contact
      await storage.updateWhatsAppContact(contact.id, {
        optIn: false,
        optOutAt: new Date(),
        updatedAt: new Date()
      });
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
    
    // Send confirmation
    await client.sendTextMessage(phoneNumber, 
      `You've been unsubscribed. You will no longer receive messages from us. ` +
      `If you change your mind, reply YES to re-subscribe.`
    );
    
    console.log(`✅ Processed opt-out for ${phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Error handling opt-out:', error);
  }
}

// Send acknowledgment for unknown buttons
async function sendButtonAcknowledgment(phoneNumber: string, buttonText: string) {
  try {
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
    
    await client.sendTextMessage(phoneNumber, 
      `Thanks for your response! We'll get back to you shortly.`
    );
    
    console.log(`✅ Sent acknowledgment for ${buttonText} to ${phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Error sending button acknowledgment:', error);
  }
}

// Trigger marketing automation workflow
async function triggerMarketingAutomation(leadId: number, workflowTrigger: string) {
  try {
    console.log(`🚀 Triggering marketing automation for lead ${leadId}: ${workflowTrigger}`);
    
    // Import the marketing automation engine
    const { MarketingAutomationEngine } = await import('@/lib/marketing-automation/engine');
    const engine = new MarketingAutomationEngine();
    
    // Find appropriate workflow based on trigger
    const workflows = await getWorkflowsByTrigger(workflowTrigger);
    
    if (workflows.length === 0) {
      console.warn(`⚠️ No workflows found for trigger: ${workflowTrigger}`);
      return;
    }
    
    // Execute each matching workflow
    for (const workflow of workflows) {
      try {
        console.log(`🎯 Executing workflow: ${workflow.name} (${workflow.id})`);
        await engine.triggerWorkflow(workflow.id, leadId.toString(), {
          trigger: workflowTrigger,
          source: 'whatsapp',
          timestamp: new Date().toISOString()
        });
        console.log(`✅ Workflow executed successfully: ${workflow.id}`);
      } catch (error) {
        console.error(`❌ Error executing workflow ${workflow.id}:`, error);
        // Continue with other workflows even if one fails
      }
    }
    
  } catch (error) {
    console.error('❌ Error triggering marketing automation:', error);
    throw new Error(`Marketing automation trigger failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Get workflows by trigger type
async function getWorkflowsByTrigger(trigger: string): Promise<any[]> {
  try {
    // This would typically query a database or workflow registry
    // For now, return hardcoded workflows based on trigger type
    const triggerWorkflows: Record<string, any[]> = {
      'get_offer_initiated': [{
        id: 'whatsapp_get_offer',
        name: 'WhatsApp Get Offer Follow-up',
        description: 'Follow-up workflow for get offer requests from WhatsApp',
        trigger: { type: 'whatsapp_action' },
        conditions: [],
        actions: [
          {
            id: 'send_offer_info',
            type: 'send_whatsapp',
            config: {
              template: 'offer_info',
              delay: 0
            }
          },
          {
            id: 'schedule_followup',
            type: 'add_tag',
            config: {
              tags: ['offer_requested', 'whatsapp_lead'],
              delay: 300 // 5 minutes
            }
          }
        ],
        settings: {
          allowReentry: false,
          exitOnConversion: true,
          maxExecutionsPerLead: 1
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      'evaluation_initiated': [{
        id: 'whatsapp_evaluation',
        name: 'WhatsApp Property Evaluation',
        description: 'Property evaluation workflow for WhatsApp leads',
        trigger: { type: 'whatsapp_action' },
        conditions: [],
        actions: [
          {
            id: 'send_evaluation_questions',
            type: 'send_whatsapp',
            config: {
              template: 'evaluation_questions',
              delay: 0
            }
          },
          {
            id: 'schedule_callback',
            type: 'add_tag',
            config: {
              tags: ['evaluation_requested', 'property_lead'],
              delay: 600 // 10 minutes
            }
          }
        ],
        settings: {
          allowReentry: false,
          exitOnConversion: true,
          maxExecutionsPerLead: 1
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      'questions_initiated': [{
        id: 'whatsapp_questions',
        name: 'WhatsApp General Questions',
        description: 'General questions workflow for WhatsApp leads',
        trigger: { type: 'whatsapp_action' },
        conditions: [],
        actions: [
          {
            id: 'send_faq_link',
            type: 'send_whatsapp',
            config: {
              template: 'faq_response',
              delay: 0
            }
          },
          {
            id: 'tag_as_info_seeker',
            type: 'add_tag',
            config: {
              tags: ['info_seeker', 'whatsapp_lead'],
              delay: 0
            }
          }
        ],
        settings: {
          allowReentry: true,
          exitOnConversion: false,
          maxExecutionsPerLead: 3
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }]
    };
    
    return triggerWorkflows[trigger] || [];
  } catch (error) {
    console.error('❌ Error getting workflows by trigger:', error);
    return [];
  }
}

// Find lead by phone number
async function findLeadByPhone(phoneNumber: string): Promise<any | null> {
  try {
    // Format phone number for consistent searching
    const formattedPhone = WhatsAppCompliance.formatPhoneNumber(phoneNumber);
    
    // Search for leads with matching phone number
    const leads = await storage.getLeads({
      phone: formattedPhone,
      limit: 1
    });

    return leads.length > 0 ? leads[0] : null;
  } catch (error) {
    console.error('❌ Error finding lead by phone:', error);
    return null;
  }
}

// Create new lead from WhatsApp message
async function createLeadFromWhatsApp(phoneNumber: string, messageText: string, messageId: string) {
  try {
    const formattedPhone = WhatsAppCompliance.formatPhoneNumber(phoneNumber);
    
    // Extract name from message if possible (simple heuristic)
    const nameMatch = messageText.match(/my name is\s+([a-zA-Z\s]+)/i);
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown';

    // Create new lead
    const newLead = await storage.createLead({
      leadId: `whatsapp-${Date.now()}`,
      propertyAddress: 'TBD',
      city: 'TBD',
      state: 'TBD',
      zip: '00000',
      ownerName: name,
      ownerPhone: formattedPhone,
      source: 'whatsapp',
      status: 'new',
      notes: `Initial WhatsApp message: "${messageText.substring(0, 200)}"`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create communication record
    await storage.createCommunication({
      leadId: newLead.id,
      type: 'whatsapp',
      direction: 'inbound',
      body: messageText,
      from: formattedPhone,
      to: 'CRM',
      status: 'received',
      providerMessageId: messageId,
      createdByUserId: 1 // System user
    });

    // Send welcome message
    await sendWelcomeMessage(phoneNumber, name);

    console.log(`✅ Created new lead from WhatsApp: ${newLead.id}`);

  } catch (error) {
    console.error('❌ Error creating lead from WhatsApp:', error);
  }
}

// Update existing lead communication
async function updateLeadCommunication(leadId: number, phoneNumber: string, messageText: string, messageId: string) {
  try {
    const formattedPhone = WhatsAppCompliance.formatPhoneNumber(phoneNumber);

    // Create communication record
    await storage.createCommunication({
      leadId,
      type: 'whatsapp',
      direction: 'inbound',
      body: messageText,
      from: formattedPhone,
      to: 'CRM',
      status: 'received',
      providerMessageId: messageId,
      createdByUserId: 1 // System user
    });

    // Update lead status if needed
    const lead = await storage.getLead(leadId);
    if (lead && lead.status === 'new') {
      await storage.updateLead(leadId, {
        status: 'contacted',
        updatedAt: new Date()
      });
    }

    console.log(`✅ Updated lead communication: ${leadId}`);

  } catch (error) {
    console.error('❌ Error updating lead communication:', error);
  }
}

// Send opt-in request
async function sendOptInRequest(phoneNumber: string, phoneNumberId: string) {
  try {
    const client = new WhatsAppClient({
      phoneNumberId: phoneNumberId,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
      phoneNumber: process.env.WHATSAPP_PHONE_NUMBER!,
      displayName: process.env.WHATSAPP_DISPLAY_NAME || 'FlipStackk CRM',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!,
      isActive: true,
      createdAt: new Date(),
    });

    const message = `Hello! You've contacted us via WhatsApp. To continue this conversation and receive property-related messages, please reply "YES" to opt-in. You can opt-out at any time by replying "STOP".`;

    await client.sendTextMessage(phoneNumber, message);

    console.log(`📤 Sent opt-in request to ${phoneNumber}`);

  } catch (error) {
    console.error('❌ Error sending opt-in request:', error);
  }
}

// Send welcome message to new lead
async function sendWelcomeMessage(phoneNumber: string, name: string) {
  try {
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

    // Use interactive message for welcome
    await client.sendInteractiveMessage(phoneNumber, {
      type: 'button',
      body: { text: `Hi ${name}! Welcome to our property buying service. We've received your message and will get back to you shortly. In the meantime, how can we help you today?` },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'get_offer', title: 'Get Cash Offer' } },
          { type: 'reply', reply: { id: 'evaluation', title: 'Property Evaluation' } },
          { type: 'reply', reply: { id: 'questions', title: 'General Questions' } }
        ]
      },
      header: { type: 'text', text: 'Welcome! 🏠' },
      footer: { text: 'We buy properties fast & easy' }
    });

    console.log(`📤 Sent welcome message to ${phoneNumber}`);

  } catch (error) {
    console.error('❌ Error sending welcome message:', error);
  }
}

// Handle WhatsApp webhook verification (GET request)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    
    if (!verifyToken) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 501 });
    }

    const verification = verifyWhatsAppWebhook(mode, token, challenge, verifyToken);

    if (verification.verified) {
      console.log('✅ WhatsApp webhook verified');
      return new NextResponse(verification.challenge, { status: 200 });
    } else {
      console.error('❌ WhatsApp webhook verification failed');
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    }

  } catch (error) {
    console.error('❌ WhatsApp webhook verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle incoming WhatsApp messages (POST request)
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('X-Hub-Signature-256');
    
    // Verify webhook signature for security
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret) {
      console.error('WhatsApp webhook not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 501 });
    }

    // Verify signature if provided (recommended for production)
    if (signature) {
      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', appSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('❌ Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    let payload: WhatsAppWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (e) {
      console.error('Invalid JSON payload');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log('📱 Received WhatsApp webhook:', JSON.stringify(payload, null, 2));

    // Process each entry
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          const phoneNumberId = change.value.metadata.phone_number_id;
          
          // Handle incoming messages
          if (change.value.messages) {
            for (const message of change.value.messages) {
              await processIncomingMessage(message, phoneNumberId);
            }
          }
          
          // Handle message status updates
          if (change.value.statuses) {
            for (const status of change.value.statuses) {
              await processMessageStatus(status);
            }
          }
        }
      }
    }

    return NextResponse.json({ message: 'Event processed successfully' }, { status: 200 });

  } catch (error) {
    console.error('❌ WhatsApp webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}