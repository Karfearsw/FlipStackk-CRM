import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { WhatsAppClient } from '@/lib/whatsapp/client';
import { WhatsAppMessageBuilder } from '@/lib/whatsapp/templates';

// Get all WhatsApp templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const phoneNumberId = searchParams.get('phoneNumberId');

    if (!phoneNumberId) {
      return NextResponse.json({ error: 'phoneNumberId is required' }, { status: 400 });
    }

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

    const templates = await client.getMessageTemplates();

    return NextResponse.json({
      success: true,
      templates,
      total: templates.length
    });

  } catch (error) {
    console.error('Error fetching WhatsApp templates:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch WhatsApp templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create a new WhatsApp template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumberId, template } = await request.json();

    if (!phoneNumberId || !template) {
      return NextResponse.json({ 
        error: 'phoneNumberId and template are required' 
      }, { status: 400 });
    }

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

    const result = await client.createMessageTemplate(template);

    return NextResponse.json({
      success: true,
      template: result,
      message: 'Template created successfully'
    });

  } catch (error) {
    console.error('Error creating WhatsApp template:', error);
    return NextResponse.json({ 
      error: 'Failed to create WhatsApp template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create predefined CRM templates
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumberId } = await request.json();

    if (!phoneNumberId) {
      return NextResponse.json({ error: 'phoneNumberId is required' }, { status: 400 });
    }

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

    // Predefined CRM templates
    const crmTemplates = [
      WhatsAppMessageBuilder.buildLeadFollowUp('{{1}}', '{{2}}', '{{3}}'),
      WhatsAppMessageBuilder.buildPropertyEvaluation('{{1}}', '{{2}}', '{{3}}'),
      WhatsAppMessageBuilder.buildAppointmentConfirmation('{{1}}', '{{2}}', '{{3}}', '{{4}}'),
      WhatsAppMessageBuilder.buildOfferPresentation('{{1}}', '{{2}}', '{{3}}', '{{4}}')
    ];

    const results = [];
    for (const template of crmTemplates) {
      try {
        const result = await client.createMessageTemplate(template);
        results.push({ success: true, template: result });
      } catch (error) {
        console.error(`Error creating template ${template.name}:`, error);
        results.push({ 
          success: false, 
          template: template.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful,
        failed
      },
      message: `Created ${successful} templates, ${failed} failed`
    });

  } catch (error) {
    console.error('Error creating predefined templates:', error);
    return NextResponse.json({ 
      error: 'Failed to create predefined templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}