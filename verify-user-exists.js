// Verify user exists in database
const { Client } = require('pg');

async function verifyUserExists() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:OTPSTACKK10M@db.octipyiqduroxelobtli.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');

    // Check if our test user exists
    const result = await client.query(`
      SELECT id, username, email, password, role, created_at 
      FROM users 
      WHERE username = $1
    `, ['testuser1763250582297']);

    if (result.rows.length > 0) {
      console.log('✅ User found in database:');
      console.log('User:', result.rows[0]);
      
      // Test password verification
      const bcrypt = require('bcryptjs');
      const isValid = await bcrypt.compare('TestPass123!', result.rows[0].password);
      console.log('✅ Password verification:', isValid ? 'SUCCESS' : 'FAILED');
      
    } else {
      console.log('❌ User not found in database');
      
      // List all users
      const allUsers = await client.query('SELECT id, username, email, role FROM users ORDER BY id DESC LIMIT 5');
      console.log('Recent users in database:');
      allUsers.rows.forEach(user => {
        console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
      });
    }

    await client.end();
  } catch (error) {
    console.error('Database error:', error);
    await client.end();
  }
}

verifyUserExists();