import { getClient, runWithDbContext } from './db.js';
import { reminderSql } from './reminder-sql.js';
export async function generateReminders(orgId = null) {
  return runWithDbContext({ role: 'service', orgId }, async () => {
    const client = await getClient();
    try { await client.query('BEGIN'); const results = await client.query(reminderSql); await client.query('COMMIT'); return { updated: results.reduce((sum,result) => sum + (result.rowCount || 0),0) }; }
    catch(error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  });
}
