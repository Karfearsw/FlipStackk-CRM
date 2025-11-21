import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const id = Number(idParam);
    const body = await request.json();
    const status = body.status as 'accepted' | 'rejected' | 'assigned';
    const notes = body.notes as string | undefined;
    if (!id || !status) {
      return NextResponse.json({ message: 'id and status are required' }, { status: 400 });
    }
    const updated = await storage.updateLeadAssignment(id, { status, notes });
    if (!updated) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
    }
    if (status === 'accepted') {
      await storage.updateLead(updated.leadId, { assignedToUserId: updated.assignedToUserId });
    }
    await storage.createActivity({
      userId: Number(session.user.id),
      actionType: status === 'accepted' ? 'assignment_accept' : status === 'rejected' ? 'assignment_reject' : 'assign',
      targetType: 'lead_assignment',
      targetId: id,
      description: `Updated assignment ${id} status to ${status}`,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating lead assignment:', error);
    return NextResponse.json({ message: 'Failed to update lead assignment' }, { status: 500 });
  }
}
