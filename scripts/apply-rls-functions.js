import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? true : { rejectUnauthorized: false }
});

async function applyFunctions() {
  console.log('Applying RLS helper functions...');
  
  const client = await pool.connect();
  try {
    // Create current_org_id function
    await client.query(`
      CREATE OR REPLACE FUNCTION current_org_id() RETURNS UUID AS $$
        SELECT NULLIF(current_setting('app.current_org_id', true), '')::UUID;
      $$ LANGUAGE SQL STABLE;
    `);
    console.log('current_org_id() function created');
    
    // Create set_org_context function
    await client.query(`
      CREATE OR REPLACE FUNCTION set_org_context(p_org_id UUID, p_user_id UUID) RETURNS VOID AS $$
      BEGIN
        PERFORM set_config('app.current_org_id', p_org_id::text, true);
        PERFORM set_config('app.current_user_id', p_user_id::text, true);
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('set_org_context() function created');
    
    // Verify RLS is enabled on key tables
    const result = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('goats', 'inventory', 'sales', 'health_records', 'breeding_records', 'organizations', 'users', 'organization_members')
      ORDER BY tablename
    `);
    console.log('\nRLS Status:');
    result.rows.forEach(row => {
      console.log(`  ${row.tablename}: ${row.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
    });
    
    // Verify policies exist
    const policies = await client.query(`
      SELECT tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename IN ('goats', 'inventory', 'sales', 'health_records', 'breeding_records', 'organizations', 'users', 'organization_members')
      ORDER BY tablename, policyname
    `);
    console.log('\nPolicies:');
    policies.rows.forEach(row => {
      console.log(`  ${row.tablename}.${row.policyname}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

applyFunctions().catch(console.error);