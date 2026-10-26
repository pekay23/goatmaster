import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set; refusing to apply RLS to an unknown database.');
const appDatabaseUrl = process.env.APP_DATABASE_URL;
if (!appDatabaseUrl) throw new Error('APP_DATABASE_URL must be configured with a non-BYPASSRLS role before RLS verification.');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? true : { rejectUnauthorized: false },
});
const appPool = new Pool({
  connectionString: appDatabaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? true : { rejectUnauthorized: false },
});

const requiredTables = [
  'goats', 'inventory', 'sales', 'health_records', 'breeding_records', 'alerts',
  'corrections', 'usage_logs', 'expenditures', 'milk_records', 'weight_records',
  'farm_events', 'farm_event_goats', 'users', 'organization_members', 'organizations',
  'push_subscriptions', 'audit_logs', 'impersonation_sessions', 'retention_offers',
  'sync_queue', 'goat_embeddings', 'scan_history', 'payments', 'subscriptions',
  'billing_events', 'subscription_history', 'auth_rate_limits', 'sync_mutations',
];

async function applyRLS() {
  const client = await pool.connect();
  try {
    const identity = await client.query('SELECT current_database() AS database_name');
    const present = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
      [requiredTables]
    );
    const presentNames = new Set(present.rows.map(row => row.table_name));
    const missing = requiredTables.filter(table => !presentNames.has(table));
    if (missing.length) throw new Error(`Run bun run db:migrate first; required tables are missing: ${missing.join(', ')}`);

    const sql = await readFile(join(__dirname, 'sql', 'rls-policies.sql'), 'utf8');
    console.log(`Applying tenant RLS policies to ${requiredTables.length} tables in database "${identity.rows[0].database_name}"...`);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    const verification = await client.query(
      `SELECT COUNT(*)::int AS secured
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relname = ANY($1::text[])
         AND c.relrowsecurity AND c.relforcerowsecurity`,
      [requiredTables]
    );
    if (verification.rows[0].secured !== requiredTables.length) {
      throw new Error(`RLS verification failed: ${verification.rows[0].secured}/${requiredTables.length} tables are forced through RLS.`);
    }

    const policyCount = await client.query(
      `SELECT COUNT(DISTINCT tablename)::int AS count FROM pg_policies
       WHERE schemaname = 'public' AND tablename = ANY($1::text[])`,
      [requiredTables]
    );
    if (policyCount.rows[0].count < requiredTables.length) {
      throw new Error(`RLS policy verification failed: only ${policyCount.rows[0].count} policies found.`);
    }

    const appClient = await appPool.connect();
    try {
      const appIdentity = await appClient.query(
        `SELECT current_database() AS database_name, r.rolbypassrls
         FROM pg_roles r WHERE r.rolname = current_user`
      );
      if (appIdentity.rows[0].database_name !== identity.rows[0].database_name) {
        throw new Error('APP_DATABASE_URL points to a different database than DATABASE_URL.');
      }
      if (appIdentity.rows[0].rolbypassrls) {
        throw new Error('APP_DATABASE_URL role has BYPASSRLS; use a restricted application role.');
      }

      await appClient.query('BEGIN');
      await appClient.query(
      `SELECT set_config('app.current_org_id', '', true),
              set_config('app.current_user_id', '', true),
              set_config('app.current_role', 'service', true)`
      );
      const organizations = await appClient.query('SELECT id FROM organizations ORDER BY id LIMIT 2');
      const serviceVisible = await appClient.query('SELECT COUNT(*)::int AS count FROM organizations');
      await appClient.query('COMMIT');

      if (organizations.rows.length > 1) {
        await appClient.query('BEGIN');
        await appClient.query(
          `SELECT set_config('app.current_org_id', $1, true),
                set_config('app.current_user_id', '', true),
                set_config('app.current_role', 'user', true)`,
          [organizations.rows[0].id]
        );
        const otherOrg = await appClient.query('SELECT COUNT(*)::int AS count FROM organizations WHERE id = $1', [organizations.rows[1].id]);
        await appClient.query('COMMIT');
        if (otherOrg.rows[0].count !== 0) throw new Error('Tenant isolation verification failed: one organization can read another organization.');
      }

      await appClient.query('BEGIN');
      await appClient.query(
        `SELECT set_config('app.current_org_id', '', true),
              set_config('app.current_user_id', '', true),
              set_config('app.current_role', 'admin', true)`
      );
      const adminVisible = await appClient.query('SELECT COUNT(*)::int AS count FROM organizations');
      await appClient.query('COMMIT');
      if (adminVisible.rows[0].count !== serviceVisible.rows[0].count) {
        throw new Error('Admin RLS verification failed: administrator context cannot access all organizations.');
      }
    } finally {
      appClient.release();
    }

    console.log(`RLS verified: ${verification.rows[0].secured} tables secured, ${policyCount.rows[0].count} policies, tenant isolation and admin visibility checked.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
    await appPool.end();
    await pool.end();
  }
}

applyRLS().catch(error => {
  console.error('RLS application failed:', error.message);
  process.exitCode = 1;
});
