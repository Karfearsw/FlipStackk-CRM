import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function checkNotificationTables() {
  try {
    console.log('🔍 Checking notification system tables...');
    
    // Check if notifications table exists
    const notificationsCheckResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);
    const notificationsCheckRows = (notificationsCheckResult as any)?.rows ?? notificationsCheckResult;
    console.log('📋 Notifications table exists:', notificationsCheckRows[0]?.exists);
    
    // Check if notification_preferences table exists
    const preferencesCheckResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_preferences'
      );
    `);
    const preferencesCheckRows = (preferencesCheckResult as any)?.rows ?? preferencesCheckResult;
    console.log('📋 Notification preferences table exists:', preferencesCheckRows[0]?.exists);
    
    // Check if email_queue table exists
    const emailQueueCheckResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'email_queue'
      );
    `);
    const emailQueueCheckRows = (emailQueueCheckResult as any)?.rows ?? emailQueueCheckResult;
    console.log('📋 Email queue table exists:', emailQueueCheckRows[0]?.exists);
    
    // Check if email_templates table exists
    const emailTemplatesCheckResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'email_templates'
      );
    `);
    const emailTemplatesCheckRows = (emailTemplatesCheckResult as any)?.rows ?? emailTemplatesCheckResult;
    console.log('📋 Email templates table exists:', emailTemplatesCheckRows[0]?.exists);
    
    // Check current notification count
    if (notificationsCheckRows[0]?.exists) {
      const notificationCountResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM notifications;
      `);
      const notificationCountRows = (notificationCountResult as any)?.rows ?? notificationCountResult;
      console.log('📊 Total notifications:', notificationCountRows[0]?.count);
      
      const unreadCountResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM notifications WHERE is_read = false;
      `);
      const unreadCountRows = (unreadCountResult as any)?.rows ?? unreadCountResult;
      console.log('📊 Unread notifications:', unreadCountRows[0]?.count);
    }
    
    // Check for any failed email notifications
    if (emailQueueCheckRows[0]?.exists) {
      const failedEmailsResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM email_queue WHERE status = 'failed';
      `);
      const failedEmailsRows = (failedEmailsResult as any)?.rows ?? failedEmailsResult;
      console.log('📧 Failed emails:', failedEmailsRows[0]?.count);
      
      const pendingEmailsResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM email_queue WHERE status = 'pending';
      `);
      const pendingEmailsRows = (pendingEmailsResult as any)?.rows ?? pendingEmailsResult;
      console.log('📧 Pending emails:', pendingEmailsRows[0]?.count);
    }
    
    console.log('✅ Notification system check completed!');
    
  } catch (error) {
    console.error('❌ Error checking notification tables:', error);
  }
}

checkNotificationTables()
  .then(() => {
    console.log('🎉 Notification system analysis complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Notification system check failed:', error);
    process.exit(1);
  });