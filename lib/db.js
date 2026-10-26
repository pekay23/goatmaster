import { Pool } from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';

const dbContextStorage = new AsyncLocalStorage();
const validRoles = new Set(['anonymous', 'user', 'admin', 'super_admin', 'service']);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!process.env.APP_DATABASE_URL) {
  throw new Error('APP_DATABASE_URL must point to a PostgreSQL role without BYPASSRLS.');
}

const pool = new Pool({
  connectionString: process.env.APP_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? true : {
    rejectUnauthorized: false
  }
});

pool.on('error', error => console.error('Idle database connection error:', error.message));

const migrationPool = new Pool({
  connectionString: process.env.MIGRATIONS_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? true : {
    rejectUnauthorized: false
  }
});

migrationPool.on('error', error => console.error('Idle migration connection error:', error.message));

function normalizeContext(context = {}) {
  const role = validRoles.has(context.role) ? context.role : 'anonymous';
  return {
    userId: uuidPattern.test(context.userId || '') ? context.userId : '',
    orgId: uuidPattern.test(context.orgId || '') ? context.orgId : '',
    role,
  };
}

async function getRequestContext() {
  const explicitContext = dbContextStorage.getStore();
  if (explicitContext) return normalizeContext(explicitContext);
  try {
    const { headers } = await import('next/headers');
    const requestHeaders = await headers();
    return normalizeContext({
      userId: requestHeaders.get('x-db-user-id'),
      orgId: requestHeaders.get('x-db-org-id'),
      role: requestHeaders.get('x-db-role'),
    });
  } catch {
    return normalizeContext();
  }
}

const checkedConnections = new WeakSet();
async function requireRestrictedRole(client) {
  if(checkedConnections.has(client)) return;
  const result=await client.query('SELECT rolbypassrls,rolsuper FROM pg_roles WHERE rolname=current_user');
  if(!result.rows[0] || result.rows[0].rolbypassrls || result.rows[0].rolsuper) throw new Error('The application database role must not bypass row-level security');
  checkedConnections.add(client);
}

async function setClientContext(client, context) {
  await client.query(
    `SELECT set_config('app.current_org_id', $1, true),
            set_config('app.current_user_id', $2, true),
            set_config('app.current_role', $3, true)`,
    [context.orgId, context.userId, context.role]
  );
}

async function clearClientContext(client) {
  await client.query('ROLLBACK');
}

export function runWithDbContext(context, callback) {
  return dbContextStorage.run(normalizeContext(context), callback);
}

async function queryOn(targetPool, text, params) {
  const client = await targetPool.connect();
  let discardClient = false;
  try {
    if(targetPool===pool) await requireRestrictedRole(client);
    await client.query('BEGIN');
    await setClientContext(client, await getRequestContext());
    const result = await client.query(text, params);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    discardClient = true;
    throw error;
  } finally {
    if (discardClient) client.release(new Error('Discarding database connection after query failure'));
    else {
      try {
        await clearClientContext(client);
        client.release();
      } catch (error) {
        client.release(error);
      }
    }
  }
}

export function query(text, params) {
  return queryOn(pool, text, params);
}

export function queryAsOwner(text, params) {
  return queryOn(migrationPool, text, params);
}

export async function getClient() {
  const client = await pool.connect();
  try {
    await requireRestrictedRole(client);
    await client.query('BEGIN');
    await setClientContext(client, await getRequestContext());
  } catch (error) {
    client.release(error);
    throw error;
  }

  const release = client.release.bind(client);
  client.release = (error) => {
    if (error) return release(error);
    void clearClientContext(client).then(() => release()).catch(resetError => release(resetError));
  };
  return client;
}

export async function getMigrationClient() {
  const client = await migrationPool.connect();
  try {
    await client.query('BEGIN');
    await setClientContext(client, await getRequestContext());
  } catch (error) {
    client.release(error);
    throw error;
  }
  const release = client.release.bind(client);
  client.release = (error) => {
    if (error) return release(error);
    void clearClientContext(client).then(() => release()).catch(resetError => release(resetError));
  };
  return client;
}
