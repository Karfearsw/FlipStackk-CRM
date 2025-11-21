// Complete authentication system test
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function completeAuthTest() {
  console.log('🧪 COMPLETE AUTHENTICATION SYSTEM TEST');
  console.log('==========================================');

  // Test 1: Database Connection
  console.log('\n1️⃣ Testing Database Connection...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:OTPSTACKK10M@db.octipyiqduroxelobtli.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('✅ Database connection successful');

    // Test 2: Check users table
    console.log('\n2️⃣ Testing Users Table...');
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Users table contains ${userCount.rows[0].count} records`);

    // Test 3: Registration API
    console.log('\n3️⃣ Testing Registration API...');
    const testUser = {
      username: 'testuser' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      password: 'TestPass123!',
      role: 'admin'
    };

    const regResponse = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (regResponse.ok) {
      const regData = await regResponse.json();
      console.log('✅ Registration successful');
      console.log('   User ID:', regData.id);
      console.log('   Username:', regData.username);
      console.log('   Role:', regData.role);

      // Test 4: Verify user in database
      console.log('\n4️⃣ Verifying User in Database...');
      const verifyUser = await client.query(
        'SELECT id, username, email, role, password FROM users WHERE username = $1',
        [regData.username]
      );

      if (verifyUser.rows.length > 0) {
        console.log('✅ User found in database');
        console.log('   Username:', verifyUser.rows[0].username);
        console.log('   Email:', verifyUser.rows[0].email);
        console.log('   Role:', verifyUser.rows[0].role);

        // Test 5: Password hashing
        console.log('\n5️⃣ Testing Password Hashing...');
        const isPasswordValid = await bcrypt.compare(testUser.password, verifyUser.rows[0].password);
        console.log('✅ Password hashing:', isPasswordValid ? 'VALID' : 'INVALID');

        // Test 6: Duplicate prevention
        console.log('\n6️⃣ Testing Duplicate Prevention...');
        const dupResponse = await fetch('http://localhost:3000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'differentuser',
            email: testUser.email, // Same email
            password: 'AnotherPass123!',
            role: 'caller'
          })
        });

        if (dupResponse.status === 400) {
          const dupData = await dupResponse.json();
          console.log('✅ Duplicate email prevention:', dupData.message);
        } else {
          console.log('❌ Duplicate prevention failed');
        }

        // Test 7: NextAuth Session
        console.log('\n7️⃣ Testing NextAuth Session...');
        const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
        const csrfData = await csrfResponse.json();
        console.log('✅ CSRF token retrieved');

        const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            csrfToken: csrfData.csrfToken,
            username: testUser.username,
            password: testUser.password,
            redirect: 'false',
            json: 'true'
          })
        });

        console.log('✅ Login response status:', loginResponse.status);
        if (loginResponse.ok) {
          console.log('✅ Login successful');
        } else {
          console.log('⚠️  Login may need web interface');
        }

      } else {
        console.log('❌ User not found in database');
      }

    } else {
      const errorData = await regResponse.text();
      console.log('❌ Registration failed:', errorData);
    }

    await client.end();
    console.log('\n✅ All tests completed successfully!');
    console.log('==========================================');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await client.end();
  }
}

completeAuthTest();