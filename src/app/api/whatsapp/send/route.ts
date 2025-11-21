import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppClient } from '@/lib/whatsapp/client';
import { WhatsAppCompliance } from '@/lib/whatsapp/templates';
import { storage } from '@/lib/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Send WhatsApp message
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId, message, messageType = 'text', template, templateParams, interactive } = await request.json();

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    // Get lead information
    const lead = await storage.getLead(leadId);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (!lead.ownerPhone) {
      return NextResponse.json({ error: 'Lead has no phone number' }, { status: 400 });
    }

    // Validate and format phone number
    const formattedPhone = WhatsAppCompliance.formatPhoneNumber(lead.ownerPhone);
    if (!WhatsAppCompliance.validatePhoneNumber(formattedPhone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    // Check opt-in status
    if (!WhatsAppCompliance.hasOptIn(formattedPhone)) {
      return NextResponse.json({ error: 'Lead has not opted in for WhatsApp messages' }, { status: 403 });
    }

    // Initialize WhatsApp client
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
    let messageContent = '';

    // Send message based on type
    switch (messageType) {
      case 'text':
        if (!message) {
          return NextResponse.json({ error: 'Message content is required for text messages' }, { status: 400 });
        }
        messageContent = message;
        response = await client.sendTextMessage(formattedPhone, message);
        break;

      case 'template':
        if (!template) {
          return NextResponse.json({ error: 'Template name is required for template messages' }, { status: 400 });
        }
        messageContent = `Template: ${template}`;
        response = await client.sendTemplateMessage(formattedPhone, template, 'en_US', templateParams || []);
        break;

      case 'interactive_buttons':
        if (!interactive) {
          return NextResponse.json({ error: 'Interactive configuration is required' }, { status: 400 });
        }
        messageContent = interactive.body;
        response = await client.sendInteractiveMessage(formattedPhone, {
          type: 'button',
          body: { text: interactive.body },
          action: {
            buttons: interactive.buttons.map((btn: any) => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.title
              }
            }))
          },
          ...(interactive.header && { header: { type: 'text', text: interactive.header } }),
          ...(interactive.footer && { footer: { text: interactive.footer } })
        });
        break;

      case 'interactive_list':
        if (!interactive) {
          return NextResponse.json({ error: 'Interactive configuration is required' }, { status: 400 });
        }
        messageContent = interactive.body;
        response = await client.sendInteractiveMessage(formattedPhone, {
          type: 'list',
          body: { text: interactive.body },
          action: {
            button: interactive.buttonText,
            sections: interactive.sections
          },
          ...(interactive.header && { header: { type: 'text', text: interactive.header } }),
          ...(interactive.footer && { footer: { text: interactive.footer } })
        });
        break;

      default:
        return NextResponse.json({ error: 'Unsupported message type' }, { status: 400 });
    }

    // Create communication record
    const communication = await storage.createCommunication({
      leadId,
      type: 'whatsapp',
      direction: 'outbound',
      body: messageContent,
      from: 'CRM',
      to: formattedPhone,
      status: 'sent',
      providerMessageId: response.messages?.[0]?.id,
      createdByUserId: parseInt(session.user.id),
    });

    console.log(`📤 WhatsApp message sent to ${formattedPhone}: ${messageContent}`);

    return NextResponse.json({
      success: true,
      data: {
        communicationId: communication.id,
        messageId: response.messages?.[0]?.id,
        phoneNumber: formattedPhone,
        messageType,
        content: messageContent,
      },
    });

  } catch (error) {
    console.error('❌ WhatsApp send error:', error);
    return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 });
  }
}

// Get WhatsApp templates
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize WhatsApp client
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

    // Get available templates
    const templates = await client.getTemplates();

    return NextResponse.json({
      success: true,
      data: templates,
    });

  } catch (error) {
    console.error('❌ WhatsApp templates error:', error);
    return NextResponse.json({ error: 'Failed to get WhatsApp templates' }, { status: 500 });
  }
}

// Quick message templates for common CRM scenarios
export const WHATSAPP_QUICK_TEMPLATES = {
  leadFollowup: (leadName: string, propertyAddress: string, agentName: string) => ({
    messageType: 'template',
    template: 'lead_followup',
    templateParams: [
      { type: 'text', text: leadName },
      { type: 'text', text: propertyAddress },
      { type: 'text', text: agentName },
    ],
  }),

  propertyEvaluation: (leadName: string, propertyAddress: string, companyName: string) => ({
    messageType: 'template',
    template: 'property_evaluation',
    templateParams: [
      { type: 'text', text: leadName },
      { type: 'text', text: propertyAddress },
      { type: 'text', text: companyName },
    ],
  }),

  appointmentConfirmation: (leadName: string, date: string, time: string, propertyAddress: string) => ({
    messageType: 'template',
    template: 'appointment_confirmation',
    templateParams: [
      { type: 'text', text: leadName },
      { type: 'text', text: date },
      { type: 'text', text: time },
      { type: 'text', text: propertyAddress },
    ],
  }),

  offerPresentation: (offerAmount: string, leadName: string, propertyAddress: string, closingTimeline: string) => ({
    messageType: 'template',
    template: 'offer_presentation',
    templateParams: [
      { type: 'text', text: offerAmount },
      { type: 'text', text: leadName },
      { type: 'text', text: propertyAddress },
      { type: 'text', text: closingTimeline },
    ],
  }),

  welcomeNewLead: (leadName: string, agentName: string, companyName: string) => ({
    messageType: 'interactive_buttons',
    interactive: {
      body: `Hi ${leadName}! Welcome to ${companyName}. I'm ${agentName}, your property specialist. How can I help you today?`,
      buttons: [
        { id: 'get_offer', title: 'Get Cash Offer' },
        { id: 'evaluation', title: 'Property Evaluation' },
        { id: 'questions', title: 'General Questions' }
      ],
      header: 'Welcome! 🏠',
      footer: 'We buy properties fast & easy'
    }
  }),

  documentRequest: (leadName: string, propertyAddress: string, documents: string) => ({
    messageType: 'template',
    template: 'document_request',
    templateParams: [
      { type: 'text', text: leadName },
      { type: 'text', text: propertyAddress },
      { type: 'text', text: documents },
    ],
  }),

  closingReminder: (leadName: string, propertyAddress: string, daysUntilClosing: string) => ({
    messageType: 'template',
    template: 'closing_reminder',
    templateParams: [
      { type: 'text', text: leadName },
      { type: 'text', text: propertyAddress },
      { type: 'text', text: daysUntilClosing },
    ],
  }),

  noResponseFollowup: (leadName: string, propertyAddress: string) => ({
    messageType: 'text',
    message: `Hi ${leadName}, I hope everything is going well. I wanted to follow up on my previous message about your property at ${propertyAddress}. I understand you might be busy, so please let me know when would be a good time to continue our conversation.`,
  }),
};