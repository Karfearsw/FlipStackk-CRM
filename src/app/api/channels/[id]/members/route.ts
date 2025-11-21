import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { messagingStorage } from '@/lib/storage';
import { InsertChannelMember } from '@/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const channelId = parseInt(id);
    const members = await messagingStorage.getChannelMembers(channelId);
    
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching channel members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const channelId = parseInt(id);
    const body = await request.json();
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const memberData: InsertChannelMember = {
      channelId,
      userId: parseInt(userId),
      role: role || 'member',
      notificationsEnabled: true,
    };

    const member = await messagingStorage.addChannelMember(memberData);
    
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error adding channel member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const channelId = parseInt(id);
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const success = await messagingStorage.removeChannelMember(channelId, parseInt(userId));
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing channel member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}