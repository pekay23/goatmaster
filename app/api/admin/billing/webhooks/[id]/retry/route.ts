import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { PaystackProvider } from '@/lib/paystack';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const webhook = await query(`SELECT * FROM billing_events WHERE id = $1`, [id]);

    if (webhook.rows.length === 0) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const event = webhook.rows[0];
    const paystack = new PaystackProvider({
      secretKey: process.env.PAYSTACK_SECRET_KEY!,
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET!,
      baseUrl: 'https://api.paystack.co',
    });

    // Re-parse and process the webhook
    const normalized = paystack.parseWebhookEvent(JSON.parse(event.payload));
    
    // Process based on event type
    await processWebhookEvent(normalized);

    await query(
      `UPDATE billing_events SET status = 'processed', processed_at = NOW() WHERE id = $1`,
      [id]
    );

    return NextResponse.json({ success: true, message: 'Webhook replayed successfully' });
  } catch (err) {
    console.error('Webhook retry error:', err);
    
    await query(
      `UPDATE billing_events SET status = 'failed', error_message = $1, processed_at = NOW() WHERE id = $2`,
      [err instanceof Error ? err.message : 'Unknown error', (await params).id]
    ).catch(() => {});

    return NextResponse.json({ error: 'Failed to replay webhook' }, { status: 500 });
  }
}

async function processWebhookEvent(event: any) {
  const { query } = await import('@/lib/db');
  
  switch (event.type) {
    case 'subscription.created':
      if (event.organizationId) {
        await query(
          `UPDATE organizations SET tier = $1, subscription_status = 'active', updated_at = NOW() WHERE id = $2`,
          [event.tier, event.organizationId]
        );
        await query(
          `INSERT INTO subscription_history (organization_id, from_tier, to_tier, change_type, changed_by, reason)
           VALUES ($1, (SELECT tier FROM organizations WHERE id = $1), $2, 'upgrade', 'system', 'Paystack subscription created (replay)')
           ON CONFLICT DO NOTHING`,
          [event.organizationId, event.tier]
        );
      }
      break;
    case 'subscription.updated':
      if (event.organizationId) {
        await query(
          `UPDATE organizations SET tier = $1, subscription_status = $2, current_period_end = $3, updated_at = NOW() WHERE id = $4`,
          [event.tier, event.status, event.currentPeriodEnd, event.organizationId]
        );
      }
      break;
    case 'subscription.cancelled':
      if (event.organizationId) {
        await query(
          `UPDATE organizations SET cancel_at_period_end = true, updated_at = NOW() WHERE id = $1`,
          [event.organizationId]
        );
      }
      break;
    case 'payment.succeeded':
      if (event.organizationId) {
        await query(
          `UPDATE organizations SET subscription_status = 'active', updated_at = NOW() WHERE id = $1`,
          [event.organizationId]
        );
      }
      break;
    case 'payment.failed':
      if (event.organizationId) {
        await query(
          `UPDATE organizations SET subscription_status = 'past_due', updated_at = NOW() WHERE id = $1`,
          [event.organizationId]
        );
      }
      break;
  }
}