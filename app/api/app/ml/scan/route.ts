import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const image = body.imageBase64 ?? body.image_b64 ?? body.imageB64;
  if (typeof image !== 'string' || image.length < 8 || image.length > 7 * 1024 * 1024) return NextResponse.json({ error: 'Provide an image smaller than 5 MB' }, { status: 400 });
  if (!process.env.ML_SERVICE_URL || !process.env.ML_SERVICE_KEY) return NextResponse.json({ error: 'The scan service is not configured' }, { status: 503 });
  const plan = await query('SELECT t.smart_scan_enabled, t.max_scans_per_day FROM organizations o JOIN tiers t ON t.id = o.tier WHERE o.id = $1', [user.orgId]);
  if (!plan.rows[0]?.smart_scan_enabled) return NextResponse.json({ error: 'Smart scan is not included in your plan' }, { status: 403 });
  let reservation;
  try {
    reservation = await query("INSERT INTO scan_history (organization_id, method) VALUES ($1, 'pending') RETURNING id, created_at", [user.orgId]);
    const response = await fetch(new URL('/scan', process.env.ML_SERVICE_URL), { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-ml-key': process.env.ML_SERVICE_KEY }, body: JSON.stringify({ image_b64: image, user_id: user.sub, organization_id: user.orgId }), signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('Scan service unavailable');
    const data = await response.json();
    const confidence = typeof data.confidence === 'number' && Number.isFinite(data.confidence) ? Math.min(1, Math.max(0, data.confidence)) : 0;
    let goat = null;
    if (data.goat?.id && confidence >= 0.8) {
      const matched = await query('SELECT id, name FROM goats WHERE id = $1 AND organization_id = $2', [data.goat.id, user.orgId]);
      goat = matched.rows[0] ?? null;
    }
    const result = await query('UPDATE scan_history SET goat_id = $1, goat_name = $2, confidence = $3, detected = $4, method = $5 WHERE id = $6 RETURNING *', [goat?.id ?? null, goat?.name ?? null, confidence, Boolean(goat), 'server_resnet', reservation.rows[0].id]);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    if (reservation) await query('DELETE FROM scan_history WHERE id = $1', [reservation.rows[0].id]).catch(() => {});
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23514') return NextResponse.json({ error: 'Daily scan limit reached' }, { status: 429 });
    console.error('Scan failed:', error);
    return NextResponse.json({ error: 'The scan service is unavailable. Please try again later.' }, { status: 502 });
  }
}
