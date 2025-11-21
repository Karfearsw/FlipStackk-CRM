// Test direct database query
const { Client } = require('pg');

async function testDirectQuery() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:OTPSTACKK10M@db.octipyiqduroxelobtli.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');

    // Test query on users table (lowercase)
    console.log('\nTesting users table (lowercase):');
    try {
      const result = await client.query('SELECT id, username, email, role FROM users WHERE username = $1', ['testuser']);
      console.log('✅ users table query successful');
      console.log('Result:', result.rows);
    } catch (error) {
      console.error('❌ users table query failed:', error.message);
    }

    // Test query on User table (capitalized)
    console.log('\nTesting User table (capitalized):');
    try {
      const result = await client.query('SELECT id, username, email, role FROM "User" WHERE username = $1', ['testuser']);
      console.log('✅ User table query successful');
      console.log('Result:', result.rows);
    } catch (error) {
      console.error('❌ User table query failed:', error.message);
    }

    // Check what tables exist
    console.log('\nChecking table names:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%user%'
      ORDER BY table_name;
    `);
    console.log('User-related tables:', tables.rows);

    await client.end();
  } catch (error) {
    console.error('Database connection error:', error);
    await client.end();
  }
}

testDirectQuery();