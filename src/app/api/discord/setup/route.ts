import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { setupDiscordBot, validateDiscordEnv } from '@/lib/discord/bot';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const validation = validateDiscordEnv();
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Discord environment not configured',
        missing: validation.missing 
      }, { status: 400 });
    }
    
    const success = await setupDiscordBot();
    
    if (success) {
      return NextResponse.json({ 
        message: 'Discord bot setup completed successfully',
        bot: {
          applicationId: process.env.DISCORD_APPLICATION_ID,
          publicKey: process.env.DISCORD_PUBLIC_KEY
        }
      });
    } else {
      return NextResponse.json({ 
        error: 'Discord bot setup failed',
        details: 'Check server logs for details'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Discord setup error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const validation = validateDiscordEnv();
    
    return NextResponse.json({
      configured: validation.valid,
      missing: validation.missing,
      hasWebhookUrl: !!process.env.DISCORD_WEBHOOK_URL,
      applicationId: process.env.DISCORD_APPLICATION_ID || null,
      publicKey: process.env.DISCORD_PUBLIC_KEY || null
    });
    
  } catch (error) {
    console.error('Discord status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}