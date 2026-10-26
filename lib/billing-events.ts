import { createHash } from 'node:crypto';
import { getClient, query } from './db';
type WebhookEvent = { event: string; data: Record<string, any> };
export function parseBillingEvent(value: unknown): WebhookEvent {
  if (typeof value !== 'object' || value === null || !('event' in value) || typeof value.event !== 'string' || !('data' in value) || typeof value.data !== 'object' || value.data === null || Array.isArray(value.data)) throw new Error('Invalid webhook event');
  return { event: value.event, data: value.data };
}
function canonical(value: unknown): string { if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']'; if (typeof value === 'object' && value !== null) return '{' + Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => JSON.stringify(key) + ':' + canonical(item)).join(',') + '}'; return JSON.stringify(value) ?? 'null'; }
export async function processBillingEvent(event: WebhookEvent, existingId?: string) {
  const eventId = event.event + ':' + createHash('sha256').update(canonical(event)).digest('hex');
  const type = event.event;
  const data = event.data;
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const recorded = existingId
      ? await client.query("UPDATE billing_events SET status = 'pending', error_message = NULL WHERE id = $1 AND status = 'failed' RETURNING id", [existingId])
      : await client.query("INSERT INTO billing_events (event_id, event_type, payload, status) VALUES ($1, $2, $3, 'pending') ON CONFLICT (event_id) DO UPDATE SET status = 'pending', error_message = NULL WHERE billing_events.status = 'failed' RETURNING id", [eventId, type, JSON.stringify(event)]);
    if (!recorded.rowCount) { await client.query('COMMIT'); return; }
    const metadata = data?.metadata || {};
    let orgId = metadata?.organizationId;
    if (!orgId && data?.subscription_code) {
      const subscription = await client.query('SELECT organization_id FROM subscriptions WHERE subscription_code = $1', [data.subscription_code]);
      orgId = subscription.rows[0]?.organization_id;
    }
    if (!orgId && event.event.startsWith('subscription.') && data?.customer?.customer_code && data?.plan?.plan_code) {
      const matches=await client.query("SELECT DISTINCT p.organization_id FROM payments p WHERE p.status='success' AND p.paystack_data #>> '{customer,customer_code}'=$1 AND p.paystack_data #>> '{plan,plan_code}'=$2",[data.customer.customer_code,data.plan.plan_code]);
      if(matches.rowCount===1)orgId=matches.rows[0].organization_id;
    }
    if (!orgId && event.event.startsWith('subscription.')) throw new Error('Subscription organization could not be resolved');
    const customerEmail = data?.customer?.email;
    const customerCode = data?.customer?.customer_code;
    const subscriptionCode = data?.subscription_code;
    const planCode = data?.plan?.plan_code;
    const reference = data?.reference;
    const amount = data?.amount ?? 0;
    let tier = metadata?.tier;

    if (type === 'charge.success') {
      const payment = await client.query('SELECT organization_id, tier, amount, email FROM payments WHERE reference = $1 FOR UPDATE', [reference]);
      let expected = payment.rows[0];
      if(!expected && customerCode && planCode) {
        const renewal=await client.query("SELECT DISTINCT o.id AS organization_id,p.tier,p.amount,p.email FROM subscriptions s JOIN organizations o ON o.id=s.organization_id JOIN LATERAL (SELECT tier,amount,email FROM payments WHERE organization_id=o.id AND status='success' AND paystack_data #>> '{customer,customer_code}'=$1 AND paystack_data #>> '{plan,plan_code}'=$2 ORDER BY created_at DESC LIMIT 1) p ON true WHERE s.plan_code=$2 AND o.paystack_customer_code=$1 AND s.status='active'",[customerCode,planCode]);
        if(renewal.rowCount===1)expected=renewal.rows[0];
      }
      if (!expected || !expected.organization_id || expected.amount !== amount || data.currency !== 'GHS' || expected.email?.toLowerCase() !== customerEmail?.toLowerCase()) throw new Error('Payment does not match a server-created checkout');
      orgId = expected.organization_id;
      tier = expected.tier;
      // Record payment
      await client.query(
        `INSERT INTO payments (reference, email, amount, status, tier, organization_id, paystack_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (reference) DO UPDATE SET status = $4, paystack_data = $7`,
        [reference, customerEmail, amount, 'success', tier ?? null, orgId ?? null, JSON.stringify(data)]
      );

      // Update organization tier if this was a subscription payment
      if (orgId && tier && ['basic', 'pro', 'enterprise'].includes(tier)) {
        const prior = await client.query('SELECT tier FROM organizations WHERE id = $1', [orgId]);
        await client.query(
          `UPDATE organizations SET tier = $1, subscription_status = 'active', paystack_customer_code=COALESCE($3,paystack_customer_code), updated_at = NOW() WHERE id = $2`,
          [tier, orgId, customerCode??null]
        );
        if(prior.rows[0]?.tier!==tier)await client.query(
          `INSERT INTO subscription_history (organization_id, from_tier, to_tier, change_type, changed_by, reason)
           VALUES ($1, $2, $3, 'upgrade', 'system', 'Paystack subscription payment')
           ON CONFLICT DO NOTHING`,
          [orgId, prior.rows[0]?.tier ?? 'free', tier]
        );
      }
    } else if (type === 'subscription.create') {
      // Create/update subscription record
      await client.query(
        `INSERT INTO subscriptions (organization_id, email, plan_code, subscription_code, status, current_period_end)
         VALUES ($1, $2, $3, $4, 'active', $5)
         ON CONFLICT (subscription_code) DO UPDATE SET status = 'active', current_period_end = $5, updated_at = NOW()`,
        [orgId ?? null, customerEmail, planCode, subscriptionCode, data?.next_payment_date ?? null]
      );

      // Update organization with subscription info
      if (orgId) {
        await client.query(
          `UPDATE organizations
           SET paystack_customer_code = $1, paystack_subscription_code = $2, subscription_status = 'active',
               current_period_end = $3, updated_at = NOW()
           WHERE id = $4`,
          [customerCode, subscriptionCode, data?.next_payment_date ?? null, orgId]
        );
      }
    } else if (type === 'subscription.not_renew') {
      await client.query(
        `UPDATE subscriptions SET cancel_at_period_end = true, updated_at = NOW() WHERE subscription_code = $1`,
        [subscriptionCode]
      );
      if (orgId) {
        await client.query(
          `UPDATE organizations SET cancel_at_period_end = true, updated_at = NOW() WHERE id = $1`,
          [orgId]
        );
      }
    } else if (type === 'subscription.disable') {
      const prior = orgId ? await client.query('SELECT tier FROM organizations WHERE id = $1', [orgId]) : { rows: [] };
      await client.query(
        `UPDATE subscriptions SET status = 'cancelled', cancel_at_period_end = false, updated_at = NOW() WHERE subscription_code = $1`,
        [subscriptionCode]
      );
      if (orgId) {
        await client.query(
          `UPDATE organizations SET tier = 'free', subscription_status = 'cancelled', cancel_at_period_end = false, updated_at = NOW() WHERE id = $1`,
          [orgId]
        );
        await client.query(
          `INSERT INTO subscription_history (organization_id, from_tier, to_tier, change_type, changed_by, reason)
           VALUES ($1, $2, 'free', 'cancel', 'system', 'Paystack subscription disabled')
           ON CONFLICT DO NOTHING`,
          [orgId, prior.rows[0]?.tier ?? 'free']
        );
      }
    } else if (type === 'subscription.expiring') {
      // Subscription is about to renew - could send notification
      if (orgId) {
        await client.query(
          `UPDATE organizations SET current_period_end = $1, updated_at = NOW() WHERE id = $2`,
          [data?.next_payment_date ?? null, orgId]
        );
      }
    } else if (type === 'charge.failed') {
      // Record failed payment
      await client.query(
        `INSERT INTO payments (reference, email, amount, status, tier, organization_id, paystack_data)
         VALUES ($1, $2, $3, 'failed', $4, $5, $6)
         ON CONFLICT (reference) DO UPDATE SET status = 'failed', paystack_data = $6`,
        [reference, customerEmail, amount, tier ?? null, orgId ?? null, JSON.stringify(data)]
      );

      if (orgId) {
        await client.query(
          `UPDATE organizations SET subscription_status = 'past_due', updated_at = NOW() WHERE id = $1`,
          [orgId]
        );
      }
    }


    await client.query("UPDATE billing_events SET status = 'processed', organization_id = $1, processed_at = NOW() WHERE id = $2", [orgId ?? null, recorded.rows[0].id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    const message = error instanceof Error ? error.message : 'Processing failed';
    if (existingId) await query("UPDATE billing_events SET status = 'failed', error_message = $1 WHERE id = $2", [message, existingId]);
    else await query("INSERT INTO billing_events (event_id, event_type, payload, status, error_message) VALUES ($1, $2, $3, 'failed', $4) ON CONFLICT (event_id) DO UPDATE SET error_message = $4 WHERE billing_events.status = 'failed'", [eventId, type, JSON.stringify(event), message]);
    throw error;
  } finally { client.release(); }
}
