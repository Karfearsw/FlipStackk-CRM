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
    const existingTimesheet = await storage.getTimesheet(id);
    
    if (!existingTimesheet) {
      return NextResponse.json(
        { message: 'Timesheet not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const updatedTimesheet = await storage.updateTimesheet(id, body);
    
    await storage.createActivity({
      userId: parseInt(session.user.id),
      actionType: 'update',
      targetType: 'timesheet',
      targetId: id,
      description: `Updated timesheet`
    });
    
    return NextResponse.json(updatedTimesheet);
  } catch (error) {
    console.error('Error updating timesheet:', error);
    return NextResponse.json(
      { message: 'Failed to update timesheet' },
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
    const timesheet = await storage.getTimesheet(id);
    
    if (!timesheet) {
      return NextResponse.json(
        { message: 'Timesheet not found' },
        { status: 404 }
      );
    }
    
    const success = await storage.deleteTimesheet(id);
    
    if (!success) {
      return NextResponse.json(
        { message: 'Failed to delete timesheet' },
        { status: 500 }
      );
    }
    
    await storage.createActivity({
      userId: parseInt(session.user.id),
      actionType: 'delete',
      targetType: 'timesheet',
      targetId: id,
      description: `Deleted timesheet`
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting timesheet:', error);
    return NextResponse.json(
      { message: 'Failed to delete timesheet' },
      { status: 500 }
    );
  }
}
