import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { messagingStorage } from '@/lib/storage';

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
    const userId = parseInt(session.user.id);

    await messagingStorage.markChannelAsRead(channelId, userId);

    return NextResponse.json({ message: 'Channel marked as read' });
  } catch (error) {
    console.error('Error marking channel as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}