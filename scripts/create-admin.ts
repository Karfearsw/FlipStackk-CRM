import { storage } from '@/lib/storage';
import { hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function createFreshAdmin() {
  try {
    console.log('👤 Setting up fresh admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByUsername('admin');
    
    if (existingAdmin) {
      console.log('🔄 Updating existing admin user...');
      
      // Update existing admin user with fresh credentials
      const [updatedAdmin] = await db
        .update(users)
        .set({
          password: await hashPassword('YourSecurePassword123!'),
          email: 'admin@flipstackk.com',
          name: 'Administrator',
          role: 'admin',
          updatedAt: new Date(),
        })
        .where(eq(users.username, 'admin'))
        .returning();
      
      console.log('✅ Admin user updated successfully!');
      console.log('📋 Updated Admin Details:');
      console.log(`   Username: ${updatedAdmin.username}`);
      console.log(`   Email: ${updatedAdmin.email}`);
      console.log(`   Password: YourSecurePassword123!`);
      console.log(`   Role: ${updatedAdmin.role}`);
      console.log(`   ID: ${updatedAdmin.id}`);
    } else {
      console.log('👤 Creating new admin user...');
      
      // Create new admin user with specified credentials
      const adminUser = await storage.createUser({
        username: 'admin',
        email: 'admin@flipstackk.com',
        password: await hashPassword('YourSecurePassword123!'),
        name: 'Administrator',
        role: 'admin',
      });
      
      console.log('✅ Admin user created successfully!');
      console.log('📋 New Admin Details:');
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Password: YourSecurePassword123!`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   ID: ${adminUser.id}`);
    }
    
    // Verify the admin user
    const verifyUser = await storage.getUserByUsername('admin');
    if (verifyUser) {
      console.log('✅ Admin user verified in database');
      
      // Test password verification
      const bcrypt = require('bcryptjs');
      const isPasswordValid = await bcrypt.compare('YourSecurePassword123!', verifyUser.password);
      console.log(`✅ Password verification test: ${isPasswordValid ? 'PASSED' : 'FAILED'}`);
      
    } else {
      console.log('❌ Admin user not found in database');
    }
    
  } catch (error) {
    console.error('❌ Error creating/updating admin user:', error);
    process.exit(1);
  }
}

// Run the script
createFreshAdmin()
  .then(() => {
    console.log('🎉 Admin user setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Admin user setup failed:', error);
    process.exit(1);
  });