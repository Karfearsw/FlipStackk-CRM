import { storage } from '@/lib/storage';
import { hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function resetUsers() {
  try {
    console.log('🗑️  Deleting all existing users...');
    
    // First, check if admin user exists and get current users
    const currentUsers = await db.select().from(users);
    console.log(`Found ${currentUsers.length} existing users`);
    
    // Delete all non-admin users first to avoid foreign key constraints
    if (currentUsers.length > 0) {
      const nonAdminUserIds = currentUsers.filter(u => u.role !== 'admin').map(u => u.id);
      const adminUserIds = currentUsers.filter(u => u.role === 'admin').map(u => u.id);
      
      console.log(`Found ${nonAdminUserIds.length} non-admin users to delete`);
      console.log(`Found ${adminUserIds.length} admin users to delete`);
      
      // Delete all users (this will cascade delete related records)
      await db.delete(users);
    }
    
    console.log('✅ All users deleted successfully');
    
    console.log('👤 Creating fresh admin user...');
    
    // Create fresh admin user with specified credentials
    const adminUser = await storage.createUser({
      username: 'admin',
      email: 'admin@flipstackk.com',
      password: await hashPassword('YourSecurePassword123!'),
      name: 'Administrator',
      role: 'admin',
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📋 Admin User Details:');
    console.log(`   Username: admin`);
    console.log(`   Email: admin@flipstackk.com`);
    console.log(`   Password: YourSecurePassword123!`);
    console.log(`   Role: admin`);
    console.log(`   ID: ${adminUser.id}`);
    
    // Verify the user was created
    const verifyUser = await storage.getUserByUsername('admin');
    if (verifyUser) {
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