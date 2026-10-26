import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminUser } from '@/lib/admin-auth';
import { parseBillingEvent, processBillingEvent } from '@/lib/billing-events';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser(request);
  if (!user || !['admin', 'super_admin'].includes(String(user.role)) || user.type === 'impersonation') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
  const result = await query('SELECT status, payload FROM billing_events WHERE id = $1', [id]);
  if (!result.rowCount) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  if (result.rows[0].status !== 'failed') return NextResponse.json({ error: 'Only failed events can be retried' }, { status: 409 });
  try { const payload = result.rows[0].payload; await processBillingEvent(parseBillingEvent(typeof payload === 'string' ? JSON.parse(payload) : payload), id); return NextResponse.json({ success: true }); }
  catch (error) { console.error('Webhook replay failed:', error); return NextResponse.json({ error: 'Replay failed' }, { status: 500 }); }
}
