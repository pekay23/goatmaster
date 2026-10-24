import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const user = await getAuthUser();
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orgId = user.orgId;

    const [
      totalGoats,
      activeAlerts,
      upcomingEvents,
      lowStockItems,
      recentBirths,
      recentDeaths,
      avgWeightGain,
      milkYield,
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM goats WHERE organization_id = $1 AND status = $2', [orgId, 'active']),
      query('SELECT COUNT(*) as count FROM alerts WHERE organization_id = $1 AND is_read = false', [orgId]),
      query('SELECT COUNT(*) as count FROM farm_events WHERE organization_id = $1 AND event_date >= NOW()', [orgId]),
      query('SELECT COUNT(*) as count FROM inventory WHERE organization_id = $1 AND quantity <= min_quantity', [orgId]),
      query('SELECT COUNT(*) as count FROM farm_events WHERE organization_id = $1 AND category = $2 AND event_date >= NOW() - INTERVAL $3', [orgId, 'birth', '30 days']),
      query('SELECT COUNT(*) as count FROM goats WHERE organization_id = $1 AND status = $2 AND updated_at >= NOW() - INTERVAL $3', [orgId, 'deceased', '30 days']),
      query('SELECT AVG(weight_kg) as avg FROM weight_records WHERE organization_id = $1 AND record_date >= NOW() - INTERVAL $2', [orgId, '30 days']),
      query('SELECT SUM(morning_yield + evening_yield) as total FROM milk_records WHERE organization_id = $1 AND record_date >= NOW() - INTERVAL $2', [orgId, '7 days']),
    ]);

    return NextResponse.json({
      totalGoats: parseInt(totalGoats.rows[0]?.count || '0'),
      activeAlerts: parseInt(activeAlerts.rows[0]?.count || '0'),
      upcomingEvents: parseInt(upcomingEvents.rows[0]?.count || '0'),
      lowStockItems: parseInt(lowStockItems.rows[0]?.count || '0'),
      recentBirths: parseInt(recentBirths.rows[0]?.count || '0'),
      recentDeaths: parseInt(recentDeaths.rows[0]?.count || '0'),
      avgWeightGain: parseFloat(avgWeightGain.rows[0]?.avg || '0'),
      milkYield: parseFloat(milkYield.rows[0]?.total || '0'),
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}