// Check current database schema
const { Client } = require('pg');

async function checkDatabaseSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:OTPSTACKK10M@db.octipyiqduroxelobtli.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');

    // Check existing tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    // Check users table structure
    const usersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    if (usersColumns.rows.length > 0) {
      console.log('\nUsers table structure:');
      usersColumns.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
    }

    // Check existing users
    const usersCount = await client.query('SELECT COUNT(*) as count FROM users;');
    console.log(`\nUsers table contains ${usersCount.rows[0].count} records`);

    // Check constraints
    const constraints = await client.query(`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE connamespace = 'public'::regnamespace
      ORDER BY conname;
    `);

    console.log('\nConstraints:');
    constraints.rows.forEach(constraint => {
      const type = constraint.contype === 'p' ? 'PRIMARY KEY' : 
                   constraint.contype === 'u' ? 'UNIQUE' :
                   constraint.contype === 'f' ? 'FOREIGN KEY' : constraint.contype;
      console.log(`- ${constraint.conname}: ${type}`);
    });

    await client.end();
  } catch (error) {
    console.error('Database connection error:', error);
    await client.end();
  }
}

checkDatabaseSchema();