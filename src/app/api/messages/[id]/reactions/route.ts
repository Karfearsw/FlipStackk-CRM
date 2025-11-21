import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { messagingStorage } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const messageId = parseInt(id);
    if (isNaN(messageId)) {
      return NextResponse.json({ error: 'Invalid message ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);
    
    // Get reaction summary for the message
    const reactions = await messagingStorage.getMessageReactionSummary(messageId);
    
    return NextResponse.json(reactions);
  } catch (error) {
    console.error('Error fetching message reactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message reactions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const messageId = parseInt(id);
    if (isNaN(messageId)) {
      return NextResponse.json({ error: 'Invalid message ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);
    const { emoji } = await request.json();
    
    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    // Add reaction to the message
    const reaction = await messagingStorage.addMessageReaction({
      messageId,
      userId,
      emoji
    });
    
    return NextResponse.json(reaction);
  } catch (error) {
    console.error('Error adding message reaction:', error);
    return NextResponse.json(
      { error: 'Failed to add message reaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const messageId = parseInt(id);
    if (isNaN(messageId)) {
      return NextResponse.json({ error: 'Invalid message ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);
    const { emoji } = await request.json();
    
    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    // Remove reaction from the message
    const success = await messagingStorage.removeMessageReaction(messageId, userId, emoji);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Reaction not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error removing message reaction:', error);
    return NextResponse.json(
      { error: 'Failed to remove message reaction' },
      { status: 500 }
    );
  }
}