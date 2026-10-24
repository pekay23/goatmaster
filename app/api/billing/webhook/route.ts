import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/paystack';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventId = event?.id;
  const type = event?.event;
  const data = event?.data;

  if (!eventId) {
    return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
  }

  // Idempotency check
  const existing = await query(
    `SELECT id FROM billing_events WHERE event_id = $1 AND status = 'processed'`,
    [eventId]
  );
  if (existing.rows.length > 0) {
    console.log(`Webhook ${eventId} already processed`);
    return NextResponse.json({ received: true });
  }

  // Record the event
  await query(
    `INSERT INTO billing_events (event_id, event_type, organization_id, payload, status)
     VALUES ($1, $2, $3, $4, 'pending')`,
    [eventId, type, null, JSON.stringify(event)]
  );

  try {
    const metadata = data?.metadata || {};
    const orgId = metadata?.organizationId;
    const customerEmail = data?.customer?.email;
    const customerCode = data?.customer?.customer_code;
    const subscriptionCode = data?.subscription_code;
    const planCode = data?.plan?.plan_code;
    const reference = data?.reference;
    const amount = data?.amount ?? 0;
    const tier = metadata?.tier;
    const interval = metadata?.interval;

    if (type === 'charge.success') {
      // Record payment
      await query(
        `INSERT INTO payments (reference, email, amount, status, tier, organization_id, paystack_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (reference) DO UPDATE SET status = $4, paystack_data = $7`,
        [reference, customerEmail, amount, 'success', tier ?? null, orgId ?? null, JSON.stringify(data)]
      );

      // Update organization tier if this was a subscription payment
      if (orgId && tier && ['basic', 'pro', 'enterprise'].includes(tier)) {
        await query(
          `UPDATE organizations SET tier = $1, subscription_status = 'active', updated_at = NOW() WHERE id = $2`,
          [tier, orgId]
        );
        await query(
          `INSERT INTO subscription_history (organization_id, from_tier, to_tier, change_type, changed_by, reason)
           VALUES ($1, (SELECT tier FROM organizations WHERE id = $1), $2, 'upgrade', 'system', 'Paystack subscription created')
           ON CONFLICT DO NOTHING`,
          [orgId, tier]
        );
      }
    } else if (type === 'subscription.create') {
      // Create/update subscription record
      await query(
        `INSERT INTO subscriptions (organization_id, email, plan_code, subscription_code, status, current_period_end)
         VALUES ($1, $2, $3, $4, 'active', $5)
         ON CONFLICT (subscription_code) DO UPDATE SET status = 'active', current_period_end = $5, updated_at = NOW()`,
        [orgId ?? null, customerEmail, planCode, subscriptionCode, data?.next_payment_date ?? null]
      );

      // Update organization with subscription info
      if (orgId) {
        await query(
          `UPDATE organizations 
           SET paystack_customer_code = $1, paystack_subscription_code = $2, subscription_status = 'active', 
               current_period_end = $3, updated_at = NOW()
           WHERE id = $4`,
          [customerCode, subscriptionCode, data?.next_payment_date ?? null, orgId]
        );
      }
    } else if (type === 'subscription.disable' || type === 'subscription.not_renew') {
      await query(
        `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW() WHERE subscription_code = $1`,
        [subscriptionCode]
      );
      
      if (orgId) {
        await query(
          `UPDATE organizations SET cancel_at_period_end = true, updated_at = NOW() WHERE id = $1`,
          [orgId]
        );
        await query(
          `INSERT INTO subscription_history (organization_id, from_tier, to_tier, change_type, changed_by, reason)
           VALUES ($1, (SELECT tier FROM organizations WHERE id = $1), 'free', 'cancel', 'system', 'Subscription cancelled')
           ON CONFLICT DO NOTHING`,
          [orgId]
        );
      }
    } else if (type === 'subscription.expiring') {
      // Subscription is about to renew - could send notification
      if (orgId) {
        await query(
          `UPDATE organizations SET current_period_end = $1, updated_at = NOW() WHERE id = $2`,
          [data?.next_payment_date ?? null, orgId]
        );
      }
    } else if (type === 'charge.failed') {
      // Record failed payment
      await query(
        `INSERT INTO payments (reference, email, amount, status, tier, organization_id, paystack_data)
         VALUES ($1, $2, $3, 'failed', $4, $5, $6)
         ON CONFLICT (reference) DO UPDATE SET status = 'failed', paystack_data = $6`,
        [reference, customerEmail, amount, tier ?? null, orgId ?? null, JSON.stringify(data)]
      );

      if (orgId) {
        await query(
          `UPDATE organizations SET subscription_status = 'past_due', updated_at = NOW() WHERE id = $1`,
          [orgId]
        );
      }
    }

    // Mark event as processed
    await query(
      `UPDATE billing_events SET status = 'processed', processed_at = NOW() WHERE event_id = $1`,
      [eventId]
    );

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    
    // Mark event as failed
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    await query(
      `UPDATE billing_events SET status = 'failed', error_message = $1, processed_at = NOW() WHERE event_id = $2`,
      [errorMessage, eventId]
    ).catch(() => {});

    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}