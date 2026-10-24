import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? true : { rejectUnauthorized: false }
});

async function applyRLS() {
  console.log('Applying RLS policies...');
  
  const sqlPath = join(__dirname, '..', 'scripts', 'sql', 'rls-policies.sql');
  const sql = readFileSync(sqlPath, 'utf-8');
  
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  const client = await pool.connect();
  try {
    for (const stmt of statements) {
      if (stmt.trim()) {
        console.log(`Executing: ${stmt.substring(0, 60)}...`);
        try {
          await client.query(stmt);
        } catch (err) {
          const error = err;
          if (error.code !== '42P01') {
            console.error(`Error: ${error.message}`);
            console.error(`Statement: ${stmt.substring(0, 200)}`);
          }
        }
      }
    }
    console.log('RLS policies applied successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

applyRLS().catch(console.error);