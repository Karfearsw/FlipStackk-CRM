import { notifications, notificationPreferences, emailQueue, emailTemplates, users, type Notification as DbNotification, type NotificationPreference, InsertNotification, InsertNotificationPreference, InsertEmailQueue, InsertEmailTemplate } from '@/db/schema';
import { db } from '@/lib/db';
import { eq, and, or, sql } from 'drizzle-orm';
import { sendEmail as sendEmailViaProvider } from '@/lib/email-provider';

export interface NotificationData {
  userId: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'mention' | 'task' | 'lead' | 'deal' | 'system';
  title: string;
  message: string;
  category?: 'in_app' | 'email' | 'push' | 'sms';
  actionUrl?: string;
  actionText?: string;
  icon?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
  metadata?: Record<string, any>;
  relatedId?: number;
  relatedType?: string;
}

export interface EmailNotificationData extends NotificationData {
  toEmail: string;
  toName?: string;
  fromEmail?: string;
  fromName?: string;
  subject?: string;
  templateName?: string;
  templateData?: Record<string, any>;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(data: NotificationData): Promise<InsertNotification> {
    const notification: InsertNotification = {
      userId: data.userId,
      type: data.type,
      category: data.category || 'in_app',
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      actionText: data.actionText,
      icon: data.icon,
      priority: data.priority || 'medium',
      expiresAt: data.expiresAt,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      relatedId: data.relatedId,
      relatedType: data.relatedType,
    };

    const [createdNotification] = await db.insert(notifications).values(notification).returning();
    
    // Check user preferences and send to appropriate channels
    await this.processNotificationChannels(createdNotification);
    
    return createdNotification;
  }

  /**
   * Process notification through different channels based on user preferences
   */
  private async processNotificationChannels(notification: InsertNotification): Promise<void> {
    const preferences = await db.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, notification.userId));

    // Group preferences by notification type
    const typePreferences = preferences.filter(p => p.notificationType === notification.type);
    const defaultPreferences = preferences.filter(p => p.notificationType === 'default');

    // Process each channel
    for (const channel of ['in_app', 'email', 'push', 'sms'] as const) {
      const pref = typePreferences.find(p => p.channel === channel) || 
                   defaultPreferences.find(p => p.channel === channel);
      
      if (pref?.isEnabled && this.shouldSendNotification(pref, notification)) {
        await this.sendToChannel(notification, channel);
      }
    }
  }

  /**
   * Check if notification should be sent based on preferences and quiet hours
   */
  private shouldSendNotification(preference: InsertNotificationPreference, notification: InsertNotification): boolean {
    // Check frequency settings
    if (preference.frequency === 'never') return false;
    if (preference.frequency === 'daily' || preference.frequency === 'weekly') {
      // For daily/weekly, we'll handle this in a separate batch process
      return false;
    }

    // Check quiet hours
    if (preference.quietHoursStart && preference.quietHoursEnd) {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      
      if (this.isInQuietHours(currentTime, preference.quietHoursStart, preference.quietHoursEnd)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(currentTime: string, quietStart: string, quietEnd: string): boolean {
    const [currentHour, currentMin] = currentTime.split(':').map(Number);
    const [startHour, startMin] = quietStart.split(':').map(Number);
    const [endHour, endMin] = quietEnd.split(':').map(Number);
    
    const currentMinutes = currentHour * 60 + currentMin;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Quiet hours span midnight
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  /**
   * Send notification to specific channel
   */
  private async sendToChannel(notification: InsertNotification, channel: string): Promise<void> {
    switch (channel) {
      case 'in_app':
        // In-app notifications are already created in the database
        break;
      case 'email':
        await this.sendEmailNotification(notification);
        break;
      case 'push':
        await this.sendPushNotification(notification);
        break;
      case 'sms':
        await this.sendSmsNotification(notification);
        break;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: InsertNotification): Promise<void> {
    try {
      // Get user email from preferences or user table
      const user = await db.select().from(users).where(eq(users.id, notification.userId));
      if (!user[0]?.email) return;

      const emailData: InsertEmailQueue = {
        toEmail: user[0].email,
        toName: user[0].name || user[0].username,
        fromEmail: process.env.NOTIFICATION_EMAIL_FROM || 'notifications@yourapp.com',
        fromName: process.env.NOTIFICATION_EMAIL_FROM_NAME || 'Your App',
        subject: notification.title,
        htmlContent: this.generateEmailHtml(notification),
        textContent: notification.message,
        notificationId: notification.id,
        status: 'pending',
      };

      await db.insert(emailQueue).values(emailData);
    } catch (error) {
      console.error('Failed to queue email notification:', error);
    }
  }

  /**
   * Generate HTML email content
   */
  private generateEmailHtml(notification: InsertNotification): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #2c3e50;">${notification.title}</h2>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
          <p>${notification.message}</p>
          
          ${notification.actionUrl ? `
            <div style="margin-top: 20px;">
              <a href="${notification.actionUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                ${notification.actionText || 'View Details'}
              </a>
            </div>
          ` : ''}
        </div>
        
        <div style="margin-top: 20px; text-align: center; color: #6c757d; font-size: 12px;">
          <p>You received this notification because you have notifications enabled in your account settings.</p>
          <p><a href="${process.env.APP_URL}/settings/notifications" style="color: #007bff;">Manage your notification preferences</a></p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send push notification (placeholder for now)
   */
  private async sendPushNotification(notification: InsertNotification): Promise<void> {
    // This would integrate with a push notification service like Firebase Cloud Messaging
    // For now, we'll just log it
    console.log('Push notification would be sent:', {
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
    });
  }

  /**
   * Send SMS notification (placeholder for now)
   */
  private async sendSmsNotification(notification: InsertNotification): Promise<void> {
    // This would integrate with an SMS service like Twilio
    // For now, we'll just log it
    console.log('SMS notification would be sent:', {
      userId: notification.userId,
      message: notification.message,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<void> {
    await db.update(notifications)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(eq(notifications.id, notificationId));
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: number): Promise<void> {
    await db.update(notifications)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: number, options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    type?: string;
  }): Promise<DbNotification[]> {
    const conditions = [eq(notifications.userId, userId)];
    
    if (options?.unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }
    
    if (options?.type) {
      conditions.push(eq(
        notifications.type,
        options.type as 'info' | 'success' | 'warning' | 'error' | 'message' | 'mention' | 'task' | 'lead' | 'deal' | 'system'
      ));
    }

    const query = db.select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(sql`${notifications.createdAt} DESC`)
      .limit(options?.limit || 50)
      .offset(options?.offset || 0);

    return await query;
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql`COUNT(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));

    return Number(result[0]?.count) || 0;
  }

  /**
   * Delete old notifications (cleanup)
   */
  async cleanupOldNotifications(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db.delete(notifications)
      .where(sql`${notifications.createdAt} < ${cutoffDate}`)
      .returning({ id: notifications.id });

    return result.length;
  }

  /**
   * Create or update notification preferences
   */
  async setNotificationPreference(data: InsertNotificationPreference): Promise<InsertNotificationPreference> {
    const existing = await db.select()
      .from(notificationPreferences)
      .where(and(
        eq(notificationPreferences.userId, data.userId),
        eq(notificationPreferences.notificationType, data.notificationType),
        eq(notificationPreferences.channel, data.channel)
      ));

    if (existing.length > 0) {
      const [updated] = await db.update(notificationPreferences)
        .set(data)
        .where(eq(notificationPreferences.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(notificationPreferences).values(data).returning();
      return created;
    }
  }

  /**
   * Get notification preferences for a user
   */
  async getNotificationPreferences(userId: number): Promise<NotificationPreference[]> {
    return await db.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
  }

  /**
   * Send notification to multiple users (bulk)
   */
  async sendBulkNotification(userIds: number[], data: Omit<NotificationData, 'userId'>): Promise<void> {
    const notificationsData = userIds.map(userId => ({
      userId,
      type: data.type,
      category: data.category || 'in_app',
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      actionText: data.actionText,
      icon: data.icon,
      priority: data.priority || 'medium',
      expiresAt: data.expiresAt,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      relatedId: data.relatedId,
      relatedType: data.relatedType,
    }));

    // Batch insert notifications
    const createdNotifications = await db.insert(notifications)
      .values(notificationsData)
      .returning();

    // Process each notification through channels
    for (const notification of createdNotifications) {
      await this.processNotificationChannels(notification);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();