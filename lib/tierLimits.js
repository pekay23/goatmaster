import pool from './db';

// Cache tier configs for 5 minutes (resets on serverless cold start)
let tierCache = null;
let tierCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

/** Call after admin updates tiers to force immediate reload */
export function invalidateTierCache() {
  tierCache = null;
  tierCacheTime = 0;
}

export async function getTierConfig(tierId) {
  if (!tierCache || Date.now() - tierCacheTime > CACHE_TTL) {
    const { rows } = await pool.query('SELECT * FROM subscription_tiers ORDER BY sort_order');
    tierCache = Object.fromEntries(rows.map(r => [r.id, r]));
    tierCacheTime = Date.now();
  }
  return tierCache[tierId] || tierCache['free'];
}

export async function getUserLimits(userId) {
  const { rows } = await pool.query(
    'SELECT subscription_tier FROM users WHERE id = $1',
    [userId]
  );
  const tier = rows[0]?.subscription_tier || 'free';
  return getTierConfig(tier);
}

export async function checkGoatLimit(userId) {
  const limits = await getUserLimits(userId);
  if (limits.max_goats === -1) return { allowed: true, current: 0, max: -1 };
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int as count FROM goats WHERE user_id = $1',
    [userId]
  );
  const current = rows[0].count;
  return { allowed: current < limits.max_goats, current, max: limits.max_goats };
}

export async function checkScanLimit(userId) {
  const limits = await getUserLimits(userId);
  if (limits.max_scans_per_day === -1) return { allowed: true, current: 0, max: -1 };
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int as count FROM scan_logs
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 day'`,
    [userId]
  );
  const current = rows[0].count;
  return { allowed: current < limits.max_scans_per_day, current, max: limits.max_scans_per_day };
}

export async function checkFeatureAccess(userId, feature) {
  const limits = await getUserLimits(userId);
  switch (feature) {
    case 'ai_training': return limits.ai_training_enabled;
    case 'smart_scan': return limits.smart_scan_enabled;
    default: return true;
  }
}
