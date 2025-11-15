import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';
import { insertTimesheetSchema } from '@/db/schema';
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
      userId: searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      approved: searchParams.get('approved') !== null ? searchParams.get('approved') === 'true' : undefined
    };
    
    const timesheets = await storage.getTimesheets(filters);
    
    return NextResponse.json(timesheets);
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    return NextResponse.json(
      { message: 'Failed to fetch timesheets' },
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
    const timesheetData = insertTimesheetSchema.parse(body);
    
    const timesheet = await storage.createTimesheet(timesheetData);
    
    await storage.createActivity({
      userId: parseInt(session.user.id),
      actionType: 'create',
      targetType: 'timesheet',
      targetId: timesheet.id,
      description: `Created timesheet for ${timesheetData.totalHours} hours`
    });
    
    return NextResponse.json(timesheet, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid timesheet data', errors: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating timesheet:', error);
    return NextResponse.json(
      { message: 'Failed to create timesheet' },
      { status: 500 }
    );
  }
}
