// Archive all users into archived_users and deactivate them (set active=false, deactivated_at=now)
// Safe to run multiple times; it will not duplicate archives for already-archived source_user_id
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL is not set. Aborting.');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Ensure archived_users table exists and has a unique constraint on source_user_id to prevent duplicates
    console.log('🔧 Ensuring archived_users table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS archived_users (
        id SERIAL PRIMARY KEY,
        source_user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'caller',
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP,
        archived_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Add unique index on source_user_id to avoid duplicate archive entries across multiple runs
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'archived_users_source_user_id_key'
        ) THEN
          CREATE UNIQUE INDEX archived_users_source_user_id_key ON archived_users (source_user_id);
        END IF;
      END$$;
    `);

    // Begin transaction for atomicity
    await client.query('BEGIN');

    console.log('📦 Archiving users into archived_users (preserving relationships, no deletions)...');
    const insertRes = await client.query(`
      INSERT INTO archived_users (source_user_id, username, email, password, name, role, created_at, updated_at)
      SELECT u.id, u.username, u.email, u.password, u.name, u.role, u.created_at, u.updated_at
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM archived_users a WHERE a.source_user_id = u.id
      );
    `);

    console.log('🚫 Deactivating all users and timestamping deactivation...');
    const deactivateRes = await client.query(`
      UPDATE users SET active = FALSE, deactivated_at = NOW();
    `);

    // Verification queries
    const [{ rows: archivedCountRows }, { rows: inactiveCountRows }] = await Promise.all([
      client.query('SELECT COUNT(*)::int AS count FROM archived_users'),
      client.query('SELECT COUNT(*)::int AS count FROM users WHERE active = FALSE'),
    ]);

    await client.query('COMMIT');

    console.log('✅ Archival and deactivation completed successfully');
    console.log(`➡️  Newly archived rows this run: ${insertRes.rowCount}`);
    console.log(`➡️  Users deactivated this run: ${deactivateRes.rowCount}`);
    console.log(`📊 Archived total: ${archivedCountRows[0].count}`);
    console.log(`📊 Inactive users total: ${inactiveCountRows[0].count}`);

    // Additional integrity checks (sample)
    console.log('\n🔎 Integrity checks:');
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
    `);
    console.log(`Tables in public schema (${tables.rowCount}):`);
    tables.rows.forEach(r => console.log(` - ${r.table_name}`));

    const constraints = await client.query(`
      SELECT conname, contype FROM pg_constraint WHERE connamespace = 'public'::regnamespace ORDER BY conname;
    `);
    console.log(`Constraints (${constraints.rowCount}):`);
    constraints.rows.slice(0, 20).forEach(c => console.log(` - ${c.conname} (${c.contype})`));

  } catch (err) {
    console.error('❌ Error during archival/deactivation:', err.message || err);
    try { await client.query('ROLLBACK'); } catch {}
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
}

run();
