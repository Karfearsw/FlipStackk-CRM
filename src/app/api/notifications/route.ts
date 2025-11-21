import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { notificationService } from '@/lib/notification-service';
import { db } from '@/lib/db';
import { notifications, notificationPreferences } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/notifications
 * Get notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');

    const userNotifications = await notificationService.getUserNotifications(
      parseInt(session.user.id),
      { limit, offset, unreadOnly, type: type || undefined }
    );

    return NextResponse.json({ 
      notifications: userNotifications,
      total: userNotifications.length,
      hasMore: userNotifications.length === limit
    });
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Create a new notification (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, type, title, message, actionUrl, actionText, icon, priority, expiresAt, metadata, relatedId, relatedType } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      );
    }

    const notification = await notificationService.createNotification({
      userId: parseInt(userId),
      type,
      title,
      message,
      actionUrl,
      actionText,
      icon,
      priority,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      metadata,
      relatedId: relatedId ? parseInt(relatedId) : undefined,
      relatedType,
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark all notifications as read for the current user
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await notificationService.markAllAsRead(parseInt(session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}