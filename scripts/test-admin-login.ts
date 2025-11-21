import NextAuth from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function testAdminLogin() {
  try {
    console.log('🧪 Testing admin login...');
    
    // Test the credentials directly
    const testCredentials = {
      username: 'admin',
      password: 'YourSecurePassword123!'
    };
    
    console.log('📋 Test Credentials:');
    console.log(`   Username: ${testCredentials.username}`);
    console.log(`   Password: ${testCredentials.password}`);
    
    // Test user lookup
    const { db } = await import('@/lib/db');
    const { users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { comparePasswords } = await import('@/lib/auth');
    
    console.log('🔍 Looking up admin user in database...');
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, testCredentials.username))
      .limit(1);
    
    if (!user) {
      console.log('❌ Admin user not found in database');
      return;
    }
    
    console.log('✅ Admin user found in database');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    
    console.log('🔐 Testing password verification...');
    const isValidPassword = await comparePasswords(testCredentials.password, user.password);
    
    if (isValidPassword) {
      console.log('✅ Password verification: PASSED');
      console.log('🎉 Admin login test successful!');
    } else {
      console.log('❌ Password verification: FAILED');
      console.log('💡 Make sure the password is exactly: YourSecurePassword123!');
    }
    
  } catch (error) {
    console.error('❌ Error testing admin login:', error);
  }
}

testAdminLogin()
  .then(() => {
    console.log('✅ Admin login test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Admin login test failed:', error);
    process.exit(1);
  });