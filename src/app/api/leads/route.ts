import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';
import { insertLeadSchema } from '@/db/schema';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    let assignedToUserId: number | undefined;
    if (searchParams.get('assignedToUserId')) {
      try {
        assignedToUserId = parseInt(searchParams.get('assignedToUserId')!);
        console.log(`Parsed assignedToUserId: ${assignedToUserId}`);
      } catch (e) {
        console.error('Error parsing assignedToUserId:', e);
      }
    }
    
    let createdByUserId: number | undefined;
    if (searchParams.get('createdByUserId')) {
      try {
        createdByUserId = parseInt(searchParams.get('createdByUserId')!);
        console.log(`Parsed createdByUserId: ${createdByUserId}`);
      } catch (e) {
        console.error('Error parsing createdByUserId:', e);
      }
    }
    
    const filters = {
      status: searchParams.get('status') ? searchParams.get('status')!.split(',') : undefined,
      search: searchParams.get('search') || undefined,
      assignedToUserId,
      createdByUserId,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };
    
    console.log('Processed lead filters:', filters);
    
    const leads = await storage.getLeads(filters);
    console.log(`Returning ${leads.length} filtered leads`);
    
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { message: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    console.log('Lead creation request received:', body);
    
    const existingLeads = await storage.getLeads();
    let lastLeadNumber = 0;
    
    if (existingLeads.length > 0) {
      existingLeads.forEach(lead => {
        const match = lead.leadId.match(/LD-\d{4}-(\d{4})/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > lastLeadNumber) {
            lastLeadNumber = num;
          }
        }
      });
    }
    
    const createData = {
      leadId: body.leadId,
      propertyAddress: body.propertyAddress || "Address pending",
      city: body.city || "City pending",
      state: body.state || "State pending",
      zip: body.zip || "00000",
      ownerName: body.ownerName || "Owner pending",
      status: body.status || "new",
      ownerPhone: body.ownerPhone || null,
      ownerEmail: body.ownerEmail || null,
      source: body.source || "other",
      motivationLevel: body.motivationLevel || "unknown",
      propertyType: body.propertyType || "single-family",
      notes: body.notes || "",
      arv: body.arv ? Number(body.arv) : null,
      repairCost: body.repairCost ? Number(body.repairCost) : null,
      estimatedValue: body.estimatedValue ? Number(body.estimatedValue) : null,
      assignedToUserId: body.assignedToUserId ? Number(body.assignedToUserId) : null,
      latitude: body.latitude ? String(Number(body.latitude)) : null,
      longitude: body.longitude ? String(Number(body.longitude)) : null,
    };
    
    console.log('Processed lead data:', createData);
    
    const lead = await storage.createLead(createData);
    
    const userId = parseInt(session.user.id);
    
    await storage.createActivity({
      userId: userId,
      actionType: 'create',
      targetType: 'lead',
      targetId: lead.id,
      description: `Added a new lead: ${lead.propertyAddress}`
    });
    
    console.log('Lead created successfully:', lead);
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { message: 'Invalid lead data', errors: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { message: 'Failed to create lead', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
