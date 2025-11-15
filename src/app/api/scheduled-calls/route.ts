import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';
import { insertScheduledCallSchema } from '@/db/schema';
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
    
    const filters = {
      status: searchParams.get('status') || undefined,
      userId: searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    };
    
    const scheduledCalls = await storage.getScheduledCalls(filters);
    
    return NextResponse.json(scheduledCalls);
  } catch (error) {
    console.error('Error fetching scheduled calls:', error);
    return NextResponse.json(
      { message: 'Failed to fetch scheduled calls' },
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
    console.log("Received scheduled call data:", body);
    
    const preparedData = {
      leadId: parseInt(body.leadId),
      assignedCallerId: parseInt(body.assignedCallerId),
      scheduledTime: new Date(body.scheduledTime),
      notes: body.notes || "",
      status: body.status || "pending"
    };
    
    console.log("Prepared data:", preparedData);
    
    const validatedData = insertScheduledCallSchema.parse(preparedData);
    console.log("Validation succeeded:", validatedData);
    
    const scheduledCall = await storage.createScheduledCall(validatedData);
    console.log("Created scheduled call:", scheduledCall);
    
    const lead = await storage.getLead(preparedData.leadId);
    
    await storage.createActivity({
      userId: parseInt(session.user.id),
      actionType: 'schedule',
      targetType: 'call',
      targetId: scheduledCall.id,
      description: `Scheduled a call for lead: ${lead?.propertyAddress || 'Unknown'}`
    });
    
    return NextResponse.json(scheduledCall, { status: 201 });
  } catch (error) {
    console.error("Error in scheduled call creation:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid scheduled call data', errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create scheduled call' },
      { status: 500 }
    );
  }
}
