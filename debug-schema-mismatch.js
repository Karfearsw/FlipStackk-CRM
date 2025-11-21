// Debug schema mismatch between application and database
const { Client } = require('pg');

async function debugSchemaMismatch() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:OTPSTACKK10M@db.octipyiqduroxelobtli.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');

    // Check the actual structure of the users table
    console.log('\n=== USERS TABLE STRUCTURE ===');
    const usersStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('users table columns:');
    usersStructure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    // Check if there are any records
    const usersCount = await client.query('SELECT COUNT(*) as count FROM users;');
    console.log(`\nusers table contains ${usersCount.rows[0].count} records`);

    if (usersCount.rows[0].count > 0) {
      const sampleData = await client.query('SELECT * FROM users LIMIT 1;');
      console.log('\nSample users data:');
      console.log(sampleData.rows[0]);
    }

    // Check the application's expected schema from drizzle
    console.log('\n=== APPLICATION EXPECTED SCHEMA ===');
    console.log('Application expects these columns in users table:');
    console.log('  id: serial (primary key)');
    console.log('  username: text (not null, unique)');
    console.log('  email: text (not null, unique)');
    console.log('  password: text (not null)');
    console.log('  name: text (nullable)');
    console.log('  role: text (default: "caller")');
    console.log('  created_at: timestamp (default: now())');
    console.log('  updated_at: timestamp (nullable)');

    // Test a simple query that matches the application
    console.log('\n=== TESTING APPLICATION QUERY ===');
    try {
      const appQuery = await client.query(`
        SELECT id, username, email, password, name, role, created_at, updated_at 
        FROM users 
        WHERE username = $1
      `, ['testuser']);
      console.log('✅ Application-style query successful');
      console.log('Result:', appQuery.rows);
    } catch (error) {
      console.error('❌ Application-style query failed:', error.message);
    }

    await client.end();
  } catch (error) {
    console.error('Database connection error:', error);
    await client.end();
  }
}

debugSchemaMismatch();