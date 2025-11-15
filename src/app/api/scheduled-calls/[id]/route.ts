import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';

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
    
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const existingCall = await storage.getScheduledCall(id);
    
    if (!existingCall) {
      return NextResponse.json(
        { message: 'Scheduled call not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const updatedCall = await storage.updateScheduledCall(id, body);
    
    await storage.createActivity({
      userId: parseInt(session.user.id),
      actionType: 'update',
      targetType: 'scheduled_call',
      targetId: id,
      description: `Updated scheduled call`
    });
    
    return NextResponse.json(updatedCall);
  } catch (error) {
    console.error('Error updating scheduled call:', error);
    return NextResponse.json(
      { message: 'Failed to update scheduled call' },
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
    
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const scheduledCall = await storage.getScheduledCall(id);
    
    if (!scheduledCall) {
      return NextResponse.json(
        { message: 'Scheduled call not found' },
        { status: 404 }
      );
    }
    
    const success = await storage.deleteScheduledCall(id);
    
    if (!success) {
      return NextResponse.json(
        { message: 'Failed to delete scheduled call' },
        { status: 500 }
      );
    }
    
    await storage.createActivity({
      userId: parseInt(session.user.id),
      actionType: 'delete',
      targetType: 'scheduled_call',
      targetId: id,
      description: `Deleted scheduled call`
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting scheduled call:', error);
    return NextResponse.json(
      { message: 'Failed to delete scheduled call' },
      { status: 500 }
    );
  }
}
