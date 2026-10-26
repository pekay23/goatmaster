import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { apiError } from '../../_records';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await query(`SELECT
      (SELECT COUNT(*)::int FROM goats WHERE organization_id = $1 AND deleted_at IS NULL) AS "totalGoats",
      (SELECT COUNT(*)::int FROM goats WHERE organization_id = $1 AND deleted_at IS NULL AND status = 'active') AS "activeGoats",
      (SELECT COUNT(*)::int FROM alerts WHERE organization_id = $1 AND is_read = false) AS "activeAlerts",
      (SELECT COUNT(*)::int FROM farm_events WHERE organization_id = $1 AND deleted_at IS NULL AND completed_at IS NULL AND event_date >= CURRENT_DATE AND event_date < CURRENT_DATE + INTERVAL '8 days') AS "upcomingEvents",
      (SELECT COUNT(*)::int FROM inventory WHERE organization_id = $1 AND deleted_at IS NULL AND quantity <= low_stock_threshold) AS "lowStockItems",
      (SELECT COALESCE(SUM(kids_count), 0)::int FROM breeding_records WHERE organization_id = $1 AND deleted_at IS NULL AND status = 'kidded' AND actual_kidding_date >= CURRENT_DATE - INTERVAL '30 days') AS "recentBirths",
      (SELECT COUNT(*)::int FROM goats WHERE organization_id = $1 AND deleted_at IS NULL AND status = 'deceased' AND updated_at >= CURRENT_DATE - INTERVAL '30 days') AS "recentDeaths",
      (SELECT AVG(latest_weight - first_weight) FROM (
         SELECT DISTINCT goat_id,
           FIRST_VALUE(weight_kg) OVER (PARTITION BY goat_id ORDER BY record_date, id) AS first_weight,
           FIRST_VALUE(weight_kg) OVER (PARTITION BY goat_id ORDER BY record_date DESC, id DESC) AS latest_weight,
           COUNT(*) OVER (PARTITION BY goat_id) AS measurements
         FROM weight_records WHERE organization_id = $1 AND deleted_at IS NULL AND record_date >= CURRENT_DATE - INTERVAL '30 days'
       ) weights WHERE measurements >= 2) AS "avgWeightGain",
      (SELECT SUM(COALESCE(morning_yield, 0) + COALESCE(evening_yield, 0)) FROM milk_records WHERE organization_id = $1 AND deleted_at IS NULL AND record_date >= CURRENT_DATE - INTERVAL '7 days') AS "milkYield"`, [user.orgId]);
    const stats = result.rows[0];
    return NextResponse.json({ ...stats, avgWeightGain: stats.avgWeightGain === null ? null : Number(stats.avgWeightGain), milkYield: stats.milkYield === null ? null : Number(stats.milkYield) });
  } catch (error) { return apiError(error, 'Unable to load farm totals'); }
}
