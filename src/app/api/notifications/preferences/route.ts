import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { notificationService } from '@/lib/notification-service';
import { db } from '@/lib/db';
import { notificationPreferences } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await notificationService.getNotificationPreferences(parseInt(session.user.id));

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Failed to get notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to get notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/preferences
 * Create or update notification preferences for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationType, channel, isEnabled, frequency, quietHoursStart, quietHoursEnd, emailAddress, pushDeviceTokens } = body;

    if (!notificationType || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: notificationType, channel' },
        { status: 400 }
      );
    }

    const preference = await notificationService.setNotificationPreference({
      userId: parseInt(session.user.id),
      notificationType,
      channel,
      isEnabled: isEnabled !== undefined ? isEnabled : true,
      frequency: frequency || 'immediate',
      quietHoursStart,
      quietHoursEnd,
      emailAddress,
      pushDeviceTokens,
    });

    return NextResponse.json({ preference });
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/preferences
 * Delete a specific notification preference
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationType = searchParams.get('notificationType');
    const channel = searchParams.get('channel');

    if (!notificationType || !channel) {
      return NextResponse.json(
        { error: 'Missing required parameters: notificationType, channel' },
        { status: 400 }
      );
    }

    await db.delete(notificationPreferences)
      .where(and(
        eq(notificationPreferences.userId, parseInt(session.user.id)),
        eq(notificationPreferences.notificationType, notificationType),
        eq(notificationPreferences.channel, channel as 'email' | 'sms' | 'push' | 'in_app')
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete notification preference:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification preference' },
      { status: 500 }
    );
  }
}