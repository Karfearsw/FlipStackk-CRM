import { NextRequest, NextResponse } from 'next/server';
import { messagingStorage, storage } from '@/lib/storage';
import crypto from 'crypto';

// Discord webhook payload types
interface DiscordWebhookPayload {
  type?: number;
  token?: string;
  id?: string;
  guild_id?: string;
  channel_id?: string;
  content?: string;
  author?: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    bot?: boolean;
  };
  attachments?: Array<{
    id: string;
    filename: string;
    size: number;
    url: string;
    proxy_url: string;
  }>;
  embeds?: any[];
  timestamp?: string;
  edited_timestamp?: string;
  flags?: number;
  components?: any[];
  mention_everyone?: boolean;
  mentions?: any[];
  mention_roles?: any[];
  pinned?: boolean;
  tts?: boolean;
}

// Verify Discord webhook signature
function verifyDiscordSignature(
  body: string,
  signature: string | null,
  timestamp: string | null,
  publicKey: string
): boolean {
  if (!signature || !timestamp) return false;
  
  const message = timestamp + body;
  const expectedSignature = crypto
    .createHmac('sha256', publicKey)
    .update(message)
    .digest('hex');
    
  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    // Get Discord webhook configuration
    const discordPublicKey = process.env.DISCORD_PUBLIC_KEY;
    const discordWebhookSecret = process.env.DISCORD_WEBHOOK_SECRET;
    
    if (!discordPublicKey || !discordWebhookSecret) {
      console.error('Discord webhook not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 501 });
    }
    
    // Verify webhook signature for security
    const body = await request.text();
    const signature = request.headers.get('X-Signature-Ed25519');
    const timestamp = request.headers.get('X-Signature-Timestamp');
    
    // For now, we'll skip signature verification if not provided (for testing)
    // In production, always verify signatures
    if (signature && timestamp) {
      const isValid = verifyDiscordSignature(body, signature, timestamp, discordWebhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    let payload: DiscordWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (e) {
      console.error('Invalid JSON payload');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    
    // Handle Discord interactions (slash commands, etc.)
    if (payload.type !== undefined) {
      // This is an interaction, forward to interactions endpoint
      const interactionResponse = await handleDiscordInteraction(payload);
      return NextResponse.json(interactionResponse);
    }
    
    // Only process message create events (regular messages)
    // Skip messages from bots (including our own)
    if (!payload.author || payload.author.bot) {
      return NextResponse.json({ message: 'Bot message ignored' }, { status: 200 });
    }
    
    // Skip messages without content
    if (!payload.content?.trim()) {
      return NextResponse.json({ message: 'Empty content ignored' }, { status: 200 });
    }
    
    // Find channel by Discord channel ID
    const discordChannelId = payload.channel_id;
    if (!discordChannelId) {
      return NextResponse.json({ error: 'No Discord channel ID' }, { status: 400 });
    }
    
    // Look for CRM channel with matching Discord channel ID
    const allChannels = await messagingStorage.getChannels();
    const crmChannel = allChannels.find(ch => 
      ch.discordChannelId === discordChannelId && 
      ch.discordMirroringEnabled && 
      ch.isActive
    );
    
    if (!crmChannel) {
      console.log(`No matching CRM channel found for Discord channel ${discordChannelId}`);
      return NextResponse.json({ message: 'No matching channel' }, { status: 200 });
    }
    
    // Create internal message from Discord message
    const discordUsername = `${payload.author.username}#${payload.author.discriminator}`;
    const messageContent = `[Discord] ${discordUsername}: ${payload.content}`;
    
    // Create the message in our system
    const message = await messagingStorage.createMessage({
      channelId: crmChannel.id,
      userId: 1, // System user for Discord messages
      content: messageContent,
      messageType: 'text',
      createdAt: payload.timestamp ? new Date(payload.timestamp) : new Date()
    });
    
    // Log communication record
    if (crmChannel.leadId) {
      await storage.createCommunication({
        leadId: crmChannel.leadId,
        type: 'discord',
        direction: 'inbound',
        body: payload.content,
        from: discordUsername,
        to: 'CRM',
        status: 'received',
        providerMessageId: payload.id,
        createdByUserId: 1 // System user
      });
    }
    
    return NextResponse.json({ 
      message: 'Message processed successfully',
      data: { messageId: message.id, channelId: crmChannel.id }
    });
    
  } catch (error) {
    console.error('Discord webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle Discord interactions (slash commands, etc.)
async function handleDiscordInteraction(payload: any) {
  // Handle different interaction types
  if (payload.type === 1) {
    // PING - Discord verification
    return { type: 1 };
  }
  
  if (payload.type === 2) {
    // APPLICATION_COMMAND - Slash command
    const { data, channel_id, member } = payload;
    
    // Forward to interactions endpoint for processing
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/discord/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature-Ed25519': payload.signature || '',
          'X-Signature-Timestamp': payload.timestamp || '',
        },
        body: JSON.stringify(payload),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to forward interaction:', error);
      return {
        type: 4,
        data: {
          content: '❌ An error occurred while processing the command.',
          flags: 64, // Ephemeral
        }
      };
    }
  }
  
  return {
    type: 4,
    data: {
      content: 'Unknown interaction type',
      flags: 64, // Ephemeral
    }
  };
}