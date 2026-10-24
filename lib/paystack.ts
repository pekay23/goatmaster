const BASE = 'https://api.paystack.co';

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set');
  return key;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok || json?.status === false) {
    throw new Error(json?.message || `Paystack request failed: ${res.status}`);
  }
  return json as T;
}

export interface InitializeTransactionParams {
  email: string;
  amount: number; // in pesewas (smallest unit)
  currency?: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  plan?: string;
  channels?: string[];
}

export async function initializeTransaction(params: InitializeTransactionParams): Promise<{ status: boolean; message: string; data: { authorization_url: string; access_code: string; reference: string } }> {
  return request<{ status: boolean; message: string; data: { authorization_url: string; access_code: string; reference: string } }>(
    '/transaction/initialize',
    { method: 'POST', body: JSON.stringify(params) }
  );
}

export async function verifyTransaction(reference: string) {
  return request<{ status: boolean; message: string; data: { status: string; reference: string; amount: number; customer: { email: string } } }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: 'GET' }
  );
}

export async function createSubscription(params: { customer: string; plan: string; authorization?: string }) {
  return request<{ status: boolean; message: string; data: { subscription_code: string; email_token: string } }>(
    '/subscription',
    { method: 'POST', body: JSON.stringify(params) }
  );
}

export async function cancelSubscription(code: string, token: string) {
  return request<{ status: boolean; message: string }>(
    '/subscription/disable',
    { method: 'POST', body: JSON.stringify({ code, token }) }
  );
}

export interface PaystackConfig {
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
  baseUrl: string;
}

export interface CheckoutParams {
  email: string;
  amountCents: number;
  currency: 'GHS';
  callbackUrl: string;
  metadata: {
    organizationId: string;
    tier: string;
  };
  channels?: ('card' | 'mobile_money' | 'bank_transfer' | 'ussd')[];
}

export interface NormalizedEvent {
  type: 'subscription.created' | 'subscription.updated' | 'subscription.cancelled' | 'payment.succeeded' | 'payment.failed';
  organizationId: string;
  customerId: string;
  subscriptionId: string;
  tier: string;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  currentPeriodEnd: Date;
  amount?: number;
  currency: string;
}

export class PaystackProvider {
  name = 'paystack' as const;
  private config: PaystackConfig;

  constructor(config: PaystackConfig) {
    this.config = config;
  }

  async createCheckoutSession(params: CheckoutParams) {
    const response = await fetch(`${this.config.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amountCents,
        currency: params.currency,
        callback_url: params.callbackUrl,
        metadata: params.metadata,
        channels: params.channels || ['card', 'mobile_money', 'bank_transfer', 'ussd'],
      }),
    });

    const data = await response.json();
    if (!data.status) throw new Error(data.message);

    return {
      url: data.data.authorization_url,
      reference: data.data.reference,
      accessCode: data.data.access_code,
    };
  }

  async createPortalSession(customerCode: string, returnUrl: string) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/billing?customer=${customerCode}&return=${returnUrl}`;
  }

  verifyWebhook(payload: string, signature: string): NormalizedEvent | null {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha512', this.config.webhookSecret)
      .update(payload).digest('hex');
    if (hash !== signature) return null;
    return JSON.parse(payload);
  }

  parseWebhookEvent(event: any): NormalizedEvent {
    const data = event.data;
    return {
      type: this.mapPaystackEvent(event.event),
      organizationId: data.metadata?.organizationId,
      customerId: data.customer?.customer_code,
      subscriptionId: data.subscription_code,
      tier: data.metadata?.tier,
      status: this.mapPaystackStatus(data.status),
      currentPeriodEnd: data.next_payment_date ? new Date(data.next_payment_date) : new Date(),
      amount: data.amount / 100,
      currency: 'GHS',
    };
  }

  private mapPaystackEvent(event: string): NormalizedEvent['type'] {
    const map: Record<string, NormalizedEvent['type']> = {
      'charge.success': 'payment.succeeded',
      'charge.failed': 'payment.failed',
      'subscription.create': 'subscription.created',
      'subscription.disable': 'subscription.cancelled',
      'subscription.expiring': 'subscription.updated',
    };
    return map[event] || 'payment.succeeded';
  }

  private mapPaystackStatus(status: string): NormalizedEvent['status'] {
    const map: Record<string, NormalizedEvent['status']> = {
      'active': 'active',
      'past_due': 'past_due',
      'cancelled': 'cancelled',
      'complete': 'active',
    };
    return map[status] || 'active';
  }
}

import crypto from 'crypto';

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const hash = crypto.createHmac('sha512', secretKey()).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}