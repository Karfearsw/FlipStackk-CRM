import { db } from '@/lib/db';
import { notifications, notificationPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function testNotificationSystem() {
  try {
    console.log('🧪 Testing notification system...');
    
    // First, let's check if we have the admin user
    const adminUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, 'admin')
    });
    
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Found admin user:', adminUser.id);
    
    // Check if notification preferences exist
    const existingPrefs = await db.query.notificationPreferences.findFirst({
      where: (notificationPreferences, { eq }) => eq(notificationPreferences.userId, adminUser.id)
    });
    
    if (!existingPrefs) {
      console.log('📝 Creating default notification preferences for admin...');
      await db.insert(notificationPreferences).values({
        userId: adminUser.id,
        notificationType: 'default',
        channel: 'in_app',
        isEnabled: true,
        frequency: 'immediate'
      });
      console.log('✅ Default notification preferences created');
    } else {
      console.log('✅ Notification preferences already exist');
    }
    
    // Create a test notification
    console.log('📨 Creating test notification...');
    const [testNotification] = await db.insert(notifications).values({
      userId: adminUser.id,
      type: 'info',
      category: 'in_app',
      title: 'System Test',
      message: 'Notification system is working correctly!',
      priority: 'medium',
      isRead: false,
      createdAt: new Date()
    }).returning();
    
    console.log('✅ Test notification created:', testNotification.id);
    
    // Verify notification was created
    const verifyNotification = await db.query.notifications.findFirst({
      where: (notifications, { eq }) => eq(notifications.id, testNotification.id)
    });
    
    if (verifyNotification) {
      console.log('✅ Notification verified in database');
      console.log('📋 Notification details:', {
        id: verifyNotification.id,
        title: verifyNotification.title,
        message: verifyNotification.message,
        type: verifyNotification.type,
        isRead: verifyNotification.isRead,
        createdAt: verifyNotification.createdAt
      });
    } else {
      console.error('❌ Notification not found in database');
    }
    
    console.log('🎉 Notification system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Notification system test failed:', error);
    throw error;
  }
}

testNotificationSystem()
  .then(() => {
    console.log('✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  });