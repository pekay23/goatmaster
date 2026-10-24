import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');
  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }
  try {
    const res = await verifyTransaction(reference);
    if (res.data?.status === 'success') {
      const email = res.data.customer?.email;
      // tier may be in metadata; attempt lookup from payments
      await query(
        `INSERT INTO payments (reference, email, amount, status) VALUES ($1,$2,$3,'success')
         ON CONFLICT (reference) DO UPDATE SET status = 'success'`,
        [reference, email, res.data.amount]
      ).catch(() => {});
    }
    return NextResponse.json(res.data);
  } catch (err: any) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to verify' }, { status: 500 });
  }
}
