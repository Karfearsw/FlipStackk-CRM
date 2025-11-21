import { storage } from '@/lib/storage';
import { hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function resetUsers() {
  try {
    console.log('🗑️  Resetting users (keeping admin accounts)...');
    
    // Use the existing reset function that handles foreign key constraints
    const result = await storage.resetUsersKeepAdmin();
    console.log(`✅ Reset completed: ${result.deletedUserCount} users deleted, ${result.adminCount} admin users kept`);
    
    console.log('🔄 Updating/creating admin user with fresh credentials...');
    
    // Check if admin user exists
    const existingAdmin = await storage.getUserByUsername('admin');
    
    if (existingAdmin) {
      // Update existing admin user
      console.log('👤 Found existing admin user, updating credentials...');
      
      // Update the admin user with new password
      await db
        .update(users)
        .set({
          password: await hashPassword('YourSecurePassword123!'),
          email: 'admin@flipstackk.com',
          name: 'Administrator',
          updatedAt: new Date(),
        })
        .where(eq(users.username, 'admin'));
      
      console.log('✅ Admin user updated successfully!');
    } else {
      // Create new admin user
      console.log('👤 Creating new admin user...');
      
      const adminUser = await storage.createUser({
        username: 'admin',
        email: 'admin@flipstackk.com',
        password: await hashPassword('YourSecurePassword123!'),
        name: 'Administrator',
        role: 'admin',
      });
      
      console.log('✅ Admin user created successfully!');
    }
    
    // Verify the admin user
    const verifyUser = await storage.getUserByUsername('admin');
    if (verifyUser) {
      console.log('📋 Admin User Details:');
      console.log(`   Username: ${verifyUser.username}`);
      console.log(`   Email: ${verifyUser.email}`);
      console.log(`   Password: YourSecurePassword123!`);
      console.log(`   Role: ${verifyUser.role}`);
      console.log(`   ID: ${verifyUser.id}`);
      console.log('✅ Admin user verified in database');
    } else {
      console.log('❌ Admin user not found in database');
    }
    
  } catch (error) {
    console.error('❌ Error resetting users:', error);
    process.exit(1);
  }
}

// Run the reset script
resetUsers()
  .then(() => {
    console.log('🎉 User reset completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ User reset failed:', error);
    process.exit(1);
  });