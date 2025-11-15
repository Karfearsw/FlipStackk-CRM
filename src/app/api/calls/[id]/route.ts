import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';

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
    
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const call = await storage.getCall(id);
    
    if (!call) {
      return NextResponse.json(
        { message: 'Call not found' },
        { status: 404 }
      );
    }
    
    const lead = await storage.getLead(call.leadId);
    
    const success = await storage.deleteCall(id);
    
    if (!success) {
      return NextResponse.json(
        { message: 'Failed to delete call' },
        { status: 500 }
      );
    }
    
    await storage.createActivity({
      userId: parseInt(session.user.id),
      actionType: 'delete',
      targetType: 'call',
      targetId: id,
      description: `Deleted call for lead: ${lead?.propertyAddress || 'Unknown'}`
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting call:', error);
    return NextResponse.json(
      { message: 'Failed to delete call' },
      { status: 500 }
    );
  }
}
