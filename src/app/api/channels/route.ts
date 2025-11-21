import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { messagingStorage } from '@/lib/storage';
import { InsertChannel } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined;
    const leadId = searchParams.get('leadId') ? parseInt(searchParams.get('leadId')!) : undefined;
    const type = searchParams.get('type') || undefined;

    const channels = await messagingStorage.getChannels(userId, leadId, type);
    
    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, leadId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Channel name is required' }, { status: 400 });
    }

    const channelData: InsertChannel = {
      name,
      description: description || '',
      type: type || 'group',
      leadId: leadId || null,
      createdByUserId: parseInt(session.user.id),
      isActive: true,
    };

    const channel = await messagingStorage.createChannel(channelData);
    
    // Auto-add creator as admin
    await messagingStorage.addChannelMember({
      channelId: channel.id,
      userId: parseInt(session.user.id),
      role: 'admin',
      notificationsEnabled: true,
    });

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error('Error creating channel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}