import { createHash } from 'node:crypto';
import { query, runWithDbContext } from './db.js';
export async function allowAuthAttempt(email, action) {
  const key = createHash('sha256').update(action + ':' + String(email).trim().toLowerCase()).digest('hex');
  return runWithDbContext({ role: 'service' }, async () => {
    const result = await query("INSERT INTO auth_rate_limits (key) VALUES ($1) ON CONFLICT (key) DO UPDATE SET attempts = CASE WHEN auth_rate_limits.window_start < NOW() - INTERVAL '15 minutes' THEN 1 ELSE auth_rate_limits.attempts + 1 END, window_start = CASE WHEN auth_rate_limits.window_start < NOW() - INTERVAL '15 minutes' THEN NOW() ELSE auth_rate_limits.window_start END RETURNING attempts", [key]);
    if (Math.random() < 0.01) await query("DELETE FROM auth_rate_limits WHERE window_start < NOW() - INTERVAL '1 day'");
    return result.rows[0].attempts <= 10;
  });
}
