import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { WhatsAppClient } from '@/lib/whatsapp/client';
import { WhatsAppCompliance } from '@/lib/whatsapp/templates';
import { storage } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumberId, syncMode = 'bidirectional' } = await request.json();

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

    let results = {
      syncedContacts: 0,
      createdLeads: 0,
      updatedLeads: 0,
      skippedDuplicates: 0,
      errors: [] as string[]
    };

    if (syncMode === 'whatsapp_to_crm' || syncMode === 'bidirectional') {
      try {
        const contacts = await client.getBusinessProfileContacts();
        
        for (const contact of contacts) {
          try {
            const formattedPhone = WhatsAppCompliance.formatPhoneNumber(contact.phone);
            
            const existingLeads = await storage.getLeads({
              phone: formattedPhone,
              limit: 1
            });

            if (existingLeads.length > 0) {
              const lead = existingLeads[0];
              await storage.updateLead(lead.id, {
                ownerName: contact.name || lead.ownerName,
                updatedAt: new Date(),
                notes: lead.notes ? `${lead.notes}\nWhatsApp contact synced` : 'WhatsApp contact synced'
              });
              results.updatedLeads++;
            } else {
              await storage.createLead({
                leadId: `whatsapp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                propertyAddress: 'TBD',
                city: 'TBD',
                state: 'TBD',
                zip: '00000',
                ownerName: contact.name || 'Unknown',
                ownerPhone: formattedPhone,
                source: 'whatsapp',
                status: 'new',
                notes: `Synced from WhatsApp contact: ${contact.about || ''}`,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              results.createdLeads++;
            }
            
            results.syncedContacts++;
          } catch (error) {
            console.error(`Error processing contact ${contact.phone}:`, error);
            results.errors.push(`Contact ${contact.phone}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error('Error fetching WhatsApp contacts:', error);
        results.errors.push(`WhatsApp API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Successfully synced ${results.syncedContacts} contacts`
    });

  } catch (error) {
    console.error('WhatsApp contacts sync error:', error);
    return NextResponse.json({ 
      error: 'Failed to sync WhatsApp contacts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}