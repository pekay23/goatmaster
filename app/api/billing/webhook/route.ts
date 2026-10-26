import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/paystack';
import { parseBillingEvent, processBillingEvent } from '@/lib/billing-events';
export async function POST(request: Request) {
  if (!process.env.PAYSTACK_SECRET_KEY) return NextResponse.json({ error: 'Billing is not configured' }, { status: 503 });
  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, request.headers.get('x-paystack-signature'))) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  let event;
  try { event = parseBillingEvent(JSON.parse(rawBody)); } catch { return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 }); }
  try { await processBillingEvent(event); return NextResponse.json({ received: true }); }
  catch (error) { console.error('Webhook processing failed:', error); return NextResponse.json({ error: 'Processing failed' }, { status: 500 }); }
}
