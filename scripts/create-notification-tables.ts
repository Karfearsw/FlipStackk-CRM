import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function createNotificationTables() {
  try {
    console.log('🔧 Creating notification system tables...');
    
    // Create notifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'message', 'mention', 'task', 'lead', 'deal', 'system')),
        category TEXT NOT NULL DEFAULT 'in_app' CHECK (category IN ('in_app', 'email', 'push', 'sms')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        action_url TEXT,
        action_text TEXT,
        icon TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        expires_at TIMESTAMP,
        metadata TEXT, -- JSON string for additional data
        related_id INTEGER, -- ID of related entity (message, lead, etc.)
        related_type TEXT, -- Type of related entity
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
      );
    `);
    
    console.log('✅ Notifications table created');
    
    // Create notification_preferences table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        notification_type TEXT NOT NULL,
        channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'push', 'sms')),
        is_enabled BOOLEAN DEFAULT TRUE,
        frequency TEXT DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'never')),
        quiet_hours_start TEXT, -- HH:MM format
        quiet_hours_end TEXT, -- HH:MM format
        email_address TEXT, -- Override email address for this type
        push_device_tokens TEXT, -- JSON array of device tokens
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP,
        UNIQUE(user_id, notification_type, channel)
      );
    `);
    
    console.log('✅ Notification preferences table created');
    
    // Create email_templates table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        subject TEXT NOT NULL,
        html_content TEXT NOT NULL,
        text_content TEXT,
        variables TEXT, -- JSON array of available variables
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
      );
    `);
    
    console.log('✅ Email templates table created');
    
    // Create email_queue table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_queue (
        id SERIAL PRIMARY KEY,
        to_email TEXT NOT NULL,
        to_name TEXT,
        from_email TEXT NOT NULL,
        from_name TEXT,
        subject TEXT NOT NULL,
        html_content TEXT,
        text_content TEXT,
        template_id INTEGER REFERENCES email_templates(id),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
        sent_at TIMESTAMP,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        scheduled_for TIMESTAMP, -- For scheduled emails
        notification_id INTEGER REFERENCES notifications(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
      );
    `);
    
    console.log('✅ Email queue table created');
    
    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
      CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
      CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_type_channel ON notification_preferences(user_id, notification_type, channel);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
      CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_for ON email_queue(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_email_queue_notification_id ON email_queue(notification_id);
    `);
    
    console.log('✅ Indexes created');
    
    // Insert default email templates
    const welcomeTemplate = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Welcome</title></head><body><h1>Welcome to FlipStackk CRM!</h1><p>Thank you for joining us. We're excited to have you on board.</p></body></html>`;
    
    const notificationTemplate = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>{{title}}</title></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;"><h2 style="margin: 0; color: #2c3e50;">{{title}}</h2></div><div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;"><p>{{message}}</p>{{#if actionUrl}}<div style="margin-top: 20px;"><a href="{{actionUrl}}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">{{actionText}}</a></div>{{/if}}</div><div style="margin-top: 20px; text-align: center; color: #6c757d; font-size: 12px;"><p>You received this notification because you have notifications enabled in your account settings.</p></div></body></html>`;

    await db.execute(sql`
      INSERT INTO email_templates (name, subject, html_content, text_content, variables) VALUES
      ('welcome', 'Welcome to FlipStackk CRM!', ${welcomeTemplate}, 'Welcome to FlipStackk CRM! Thank you for joining us.', '["userName", "companyName"]'),
      ('notification', 'New Notification', ${notificationTemplate}, 'You have a new notification: {{title}} - {{message}}', '["title", "message", "actionUrl", "actionText"]');
    `);
    
    console.log('✅ Default email templates inserted');
    
    // Create default notification preferences for existing users
    await db.execute(sql`
      INSERT INTO notification_preferences (user_id, notification_type, channel, is_enabled, frequency)
      SELECT id, 'default', 'in_app', true, 'immediate' FROM users
      ON CONFLICT (user_id, notification_type, channel) DO NOTHING;
    `);
    
    console.log('✅ Default notification preferences created');
    
    console.log('🎉 Notification system tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating notification tables:', error);
    throw error;
  }
}

createNotificationTables()
  .then(() => {
    console.log('✅ Notification system setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Notification system setup failed:', error);
    process.exit(1);
  });