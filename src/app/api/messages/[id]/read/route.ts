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

    const messageId = parseInt(id);
    const userId = parseInt(session.user.id);

    const message = await messagingStorage.getMessage(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const readReceipt = await messagingStorage.createReadReceipt({
      messageId,
      userId,
      readAt: new Date(),
    });

    return NextResponse.json(readReceipt, { status: 201 });
  } catch (error) {
    console.error('Error creating read receipt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const messageId = parseInt(id);
    const readReceipts = await messagingStorage.getReadReceipts(messageId);

    return NextResponse.json(readReceipts);
  } catch (error) {
    console.error('Error fetching read receipts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}