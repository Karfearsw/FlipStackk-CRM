import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';
import { storage as _s } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const assignments = await storage.getLeadAssignments(
      leadId ? Number(leadId) : undefined,
      userId ? Number(userId) : undefined,
      status || undefined
    );
    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching lead assignments:', error);
    return NextResponse.json({ message: 'Failed to fetch lead assignments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const body = await request.json();
    const leadId = Number(body.leadId);
    const assignedToUserId = Number(body.assignedToUserId);
    const notes = body.notes as string | undefined;
    if (!leadId || !assignedToUserId) {
      return NextResponse.json({ message: 'leadId and assignedToUserId are required' }, { status: 400 });
    }
    const assignment = await storage.createLeadAssignment({
      leadId,
      assignedToUserId,
      assignedByUserId: Number(session.user.id),
      status: 'assigned',
      notes,
    });
    await storage.createActivity({
      userId: Number(session.user.id),
      actionType: 'assign',
      targetType: 'lead',
      targetId: leadId,
      description: `Assigned lead ${leadId} to user ${assignedToUserId}`,
    });
    const webhook = process.env.DISCORD_WEBHOOK_URL;
    if (webhook) {
      try {
        const lead = await storage.getLead(leadId);
        const toUser = await storage.getUser(assignedToUserId);
        const byUser = await storage.getUser(Number(session.user.id));
        const text = `Lead assignment: ${lead?.propertyAddress ?? `Lead ${leadId}`} → ${toUser?.name ?? `User ${assignedToUserId}`} (by ${byUser?.name ?? 'System'})`;
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text })
        });
      } catch {}
    }
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Error creating lead assignment:', error);
    return NextResponse.json({ message: 'Failed to create lead assignment' }, { status: 500 });
  }
}
