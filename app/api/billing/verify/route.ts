import { getAuthUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');
  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }
  try {
    const owned = await query('SELECT reference FROM payments WHERE reference = $1 AND organization_id = $2', [reference, user.orgId]);
    if (!owned.rowCount) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    const res = await verifyTransaction(reference);
    return NextResponse.json({ reference: res.data.reference, status: res.data.status, amount: res.data.amount });
  } catch (err: any) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to verify' }, { status: 500 });
  }
}
