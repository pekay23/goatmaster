import { Pool } from 'pg';

// Reuse the pool across hot-reloads in development
const globalForPool = globalThis;

if (!globalForPool._pgPool) {
  globalForPool._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

const pool = globalForPool._pgPool;

export default pool;
