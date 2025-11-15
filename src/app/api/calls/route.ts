import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';
import { insertCallSchema } from '@/db/schema';
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
    
    const leadId = searchParams.get('leadId') ? parseInt(searchParams.get('leadId')!) : undefined;
    const userId = searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined;
    
    const calls = await storage.getCalls(leadId, userId);
    
    return NextResponse.json(calls);
  } catch (error) {
    console.error('Error fetching calls:', error);
    return NextResponse.json(
      { message: 'Failed to fetch calls' },
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
    const callData = insertCallSchema.parse(body);
    
    const call = await storage.createCall(callData);
    
    const lead = await storage.getLead(callData.leadId);
    
    await storage.createActivity({
      userId: parseInt(session.user.id),
      actionType: 'call',
      targetType: 'lead',
      targetId: callData.leadId,
      description: `Made a call to lead: ${lead?.propertyAddress || 'Unknown'}`
    });
    
    const teamMember = await storage.getTeamMember(callData.userId);
    if (teamMember) {
      await storage.createOrUpdateTeamMember({
        ...teamMember,
        totalCalls: (teamMember.totalCalls ?? 0) + 1,
        totalRevenueGenerated: teamMember.totalRevenueGenerated?.toString() || "0",
        currentDealsValue: teamMember.currentDealsValue?.toString() || "0",
        lastActivityAt: new Date()
      });
    } else {
      await storage.createOrUpdateTeamMember({
        userId: callData.userId,
        totalCalls: 1,
        totalLeadsConverted: 0,
        totalRevenueGenerated: "0",
        currentDealsValue: "0",
        lastActivityAt: new Date()
      });
    }
    
    return NextResponse.json(call, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid call data', errors: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating call:', error);
    return NextResponse.json(
      { message: 'Failed to create call' },
      { status: 500 }
    );
  }
}
