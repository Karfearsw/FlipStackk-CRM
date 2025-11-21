import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';
import { z } from 'zod';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const leadId = parseInt(id);
    
    const lead = await storage.getLead(leadId);
    
    if (!lead) {
      return NextResponse.json(
        { message: 'Lead not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { message: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const leadId = parseInt(id);
    const body = await request.json();
    
    console.log(`Updating lead ${leadId} with data:`, body);
    
    const updateData: any = {};
    
    if (body.propertyAddress !== undefined) updateData.propertyAddress = body.propertyAddress;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.zip !== undefined) updateData.zip = body.zip;
    if (body.ownerName !== undefined) updateData.ownerName = body.ownerName;
    if (body.ownerPhone !== undefined) updateData.ownerPhone = body.ownerPhone;
    if (body.ownerEmail !== undefined) updateData.ownerEmail = body.ownerEmail;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.motivationLevel !== undefined) updateData.motivationLevel = body.motivationLevel;
    if (body.propertyType !== undefined) updateData.propertyType = body.propertyType;
    if (body.source !== undefined) updateData.source = body.source;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.arv !== undefined) updateData.arv = body.arv ? Number(body.arv) : null;
    if (body.repairCost !== undefined) updateData.repairCost = body.repairCost ? Number(body.repairCost) : null;
    if (body.estimatedValue !== undefined) updateData.estimatedValue = body.estimatedValue ? Number(body.estimatedValue) : null;
    if (body.assignedToUserId !== undefined) updateData.assignedToUserId = body.assignedToUserId ? Number(body.assignedToUserId) : null;
    if (body.latitude !== undefined) updateData.latitude = body.latitude ? String(Number(body.latitude)) : null;
    if (body.longitude !== undefined) updateData.longitude = body.longitude ? String(Number(body.longitude)) : null;
    
    const existing = await storage.getLead(leadId);
    if (!existing) {
      return NextResponse.json(
        { message: 'Lead not found' },
        { status: 404 }
      );
    }

    if (body.status !== undefined) {
      const current = existing.status as string;
      const next = body.status as string;
      const allowed: Record<string, string[]> = {
        new: ['contacted', 'unqualified'],
        contacted: ['qualified', 'unqualified', 'new'],
        qualified: ['closed', 'contacted'],
        unqualified: ['contacted', 'new'],
        closed: [],
      };
      const options = allowed[current] || [];
      if (!options.includes(next) && current !== next) {
        return NextResponse.json(
          { message: `Invalid status transition from ${current} to ${next}` },
          { status: 400 }
        );
      }
    }

    const lead = await storage.updateLead(leadId, updateData);
    
    if (!lead) {
      return NextResponse.json(
        { message: 'Lead not found' },
        { status: 404 }
      );
    }
    
    const userId = parseInt(session.user.id);
    
    await storage.createActivity({
      userId: userId,
      actionType: body.status !== undefined && existing.status !== body.status ? 'status_change' : 'update',
      targetType: 'lead',
      targetId: lead.id,
      description: body.status !== undefined && existing.status !== body.status
        ? `Changed status: ${existing.status} → ${body.status}`
        : `Updated lead: ${lead.propertyAddress}`
    });
    
    console.log('Lead updated successfully:', lead);
    return NextResponse.json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { message: 'Invalid lead data', errors: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { message: 'Failed to update lead', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const leadId = parseInt(id);
    
    const lead = await storage.getLead(leadId);
    
    if (!lead) {
      return NextResponse.json(
        { message: 'Lead not found' },
        { status: 404 }
      );
    }
    
    const success = await storage.deleteLead(leadId);
    
    if (!success) {
      return NextResponse.json(
        { message: 'Failed to delete lead' },
        { status: 500 }
      );
    }
    
    const userId = parseInt(session.user.id);
    
    await storage.createActivity({
      userId: userId,
      actionType: 'delete',
      targetType: 'lead',
      targetId: leadId,
      description: `Deleted lead: ${lead.propertyAddress}`
    });
    
    console.log('Lead deleted successfully');
    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { message: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
