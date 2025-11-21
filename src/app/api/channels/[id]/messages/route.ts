import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { messagingStorage, storage } from '@/lib/storage';
import { InsertMessage } from '@/db/schema';

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
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const messages = await messagingStorage.getMessages(channelId, limit, offset);
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
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
    const { content, messageType, fileUrl, fileName, fileSize, replyToMessageId } = body;

    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const messageData: InsertMessage = {
      channelId,
      userId: parseInt(session.user.id),
      content,
      messageType: messageType || 'text',
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      replyToMessageId: replyToMessageId || null,
    };

    const message = await messagingStorage.createMessage(messageData);
    try {
      const channel = await messagingStorage.getChannel(channelId);
      if (channel?.discordMirroringEnabled && channel?.discordWebhookUrl && channel?.leadId) {
        const username = session.user.name || session.user.email || 'CRM User';
        const prefix = channel.name ? `[${channel.name}]` : `[Channel ${channel.id}]`;
        const res = await fetch(channel.discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `${prefix} ${username}: ${content}` })
        });
        const status = res.ok ? 'sent' : 'failed';
        await storage.createCommunication({
          leadId: Number(channel.leadId),
          type: 'discord',
          direction: 'outbound',
          body: content,
          to: 'discord',
          status,
          createdByUserId: parseInt(session.user.id)
        });
      }
    } catch {}
    
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}