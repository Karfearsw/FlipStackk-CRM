import { notificationService } from '@/lib/notification-service';
import { db } from '@/lib/db';
import { users, channelMembers, channels, messages } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';

/**
 * Send notification when a new message is received
 */
export async function sendMessageNotification(
  message: typeof messages.$inferSelect,
  channel: typeof channels.$inferSelect
) {
  try {
    // Get all channel members except the sender
    const members = await db.select()
      .from(channelMembers)
      .where(and(
        eq(channelMembers.channelId, message.channelId),
        ne(channelMembers.userId, message.userId)
      ));

    // Get sender info
    const [sender] = await db.select()
      .from(users)
      .where(eq(users.id, message.userId));

    if (!sender) return;

    // Send notifications to all members
    for (const member of members) {
      await notificationService.createNotification({
        userId: member.userId,
        type: 'message',
        title: `New message in ${channel.name}`,
        message: `${sender.name || sender.username}: ${message.content}`,
        actionUrl: `/communication?channel=${channel.id}`,
        actionText: 'View Message',
        icon: '💬',
        priority: 'medium',
        relatedId: message.id,
        relatedType: 'message',
      });
    }
  } catch (error) {
    console.error('Failed to send message notification:', error);
  }
}

/**
 * Send notification when someone is mentioned
 */
export async function sendMentionNotification(
  message: typeof messages.$inferSelect,
  channel: typeof channels.$inferSelect,
  mentionedUserId: number
) {
  try {
    // Get sender info
    const [sender] = await db.select()
      .from(users)
      .where(eq(users.id, message.userId));

    if (!sender) return;

    await notificationService.createNotification({
      userId: mentionedUserId,
      type: 'mention',
      title: `You were mentioned in ${channel.name}`,
      message: `${sender.name || sender.username} mentioned you: ${message.content}`,
      actionUrl: `/communication?channel=${channel.id}`,
      actionText: 'View Message',
      icon: '@',
      priority: 'high',
      relatedId: message.id,
      relatedType: 'message',
    });
  } catch (error) {
    console.error('Failed to send mention notification:', error);
  }
}

/**
 * Send notification when added to a channel
 */
export async function sendChannelInvitationNotification(
  userId: number,
  channel: typeof channels.$inferSelect,
  invitedBy: number
) {
  try {
    // Get inviter info
    const [inviter] = await db.select()
      .from(users)
      .where(eq(users.id, invitedBy));

    if (!inviter) return;

    await notificationService.createNotification({
      userId,
      type: 'info',
      title: 'Channel Invitation',
      message: `${inviter.name || inviter.username} invited you to join ${channel.name}`,
      actionUrl: `/communication?channel=${channel.id}`,
      actionText: 'Join Channel',
      icon: '📢',
      priority: 'medium',
      relatedId: channel.id,
      relatedType: 'channel',
    });
  } catch (error) {
    console.error('Failed to send channel invitation notification:', error);
  }
}

/**
 * Send notification for lead assignments
 */
export async function sendLeadAssignmentNotification(
  userId: number,
  leadId: number,
  assignedBy: number
) {
  try {
    // Get assigner info
    const [assigner] = await db.select()
      .from(users)
      .where(eq(users.id, assignedBy));

    if (!assigner) return;

    await notificationService.createNotification({
      userId,
      type: 'lead',
      title: 'New Lead Assigned',
      message: `${assigner.name || assigner.username} assigned you a new lead`,
      actionUrl: `/leads/${leadId}`,
      actionText: 'View Lead',
      icon: '👤',
      priority: 'medium',
      relatedId: leadId,
      relatedType: 'lead',
    });
  } catch (error) {
    console.error('Failed to send lead assignment notification:', error);
  }
}

/**
 * Send notification for deal updates
 */
export async function sendDealUpdateNotification(
  userId: number,
  dealId: number,
  updateType: string,
  updatedBy: number
) {
  try {
    // Get updater info
    const [updater] = await db.select()
      .from(users)
      .where(eq(users.id, updatedBy));

    if (!updater) return;

    const messages = {
      'stage_changed': 'Deal stage updated',
      'value_changed': 'Deal value updated',
      'closed_won': 'Deal closed successfully',
      'closed_lost': 'Deal closed as lost',
      'assigned': 'Deal assigned to you',
    };

    await notificationService.createNotification({
      userId,
      type: 'deal',
      title: messages[updateType as keyof typeof messages] || 'Deal Updated',
      message: `${updater.name || updater.username} updated a deal`,
      actionUrl: `/deals/${dealId}`,
      actionText: 'View Deal',
      icon: '💰',
      priority: updateType === 'closed_won' ? 'high' : 'medium',
      relatedId: dealId,
      relatedType: 'deal',
    });
  } catch (error) {
    console.error('Failed to send deal update notification:', error);
  }
}

/**
 * Send notification for system events
 */
export async function sendSystemNotification(
  userId: number,
  title: string,
  message: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
) {
  try {
    await notificationService.createNotification({
      userId,
      type: 'system',
      title,
      message,
      icon: '⚙️',
      priority,
      relatedType: 'system',
    });
  } catch (error) {
    console.error('Failed to send system notification:', error);
  }
}