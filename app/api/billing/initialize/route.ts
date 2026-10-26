import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier, interval } = body;
    const orgId = user.orgId;
    
    if (!user.orgId) return NextResponse.json({ error: 'Organization required' }, { status: 403 });
    if (!tier || !['monthly', 'annually'].includes(interval)) {
      return NextResponse.json({ error: 'Missing tier or interval' }, { status: 400 });
    }

    // Validate organization access
    if (orgId) {
      const orgResult = await query('SELECT id, paystack_customer_code FROM organizations WHERE id = $1', [orgId]);
      if (orgResult.rows.length === 0) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
    }

    // Get plan code from tiers table
    const tierResult = await query(
      `SELECT paystack_plan_code_monthly, paystack_plan_code_annual, price_cents 
       FROM tiers WHERE id = $1`,
      [tier]
    );
    
    if (tierResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const tierData = tierResult.rows[0];
    const planCode = interval === 'annually' 
      ? tierData.paystack_plan_code_annual 
      : tierData.paystack_plan_code_monthly;
    let amount = tierData.price_cents;
    if (interval === 'annually') return NextResponse.json({ error: 'Annual checkout is unavailable until annual prices are configured' }, { status: 400 });
    if (!Number.isInteger(amount) || amount <= 0) return NextResponse.json({ error: 'This plan does not require payment' }, { status: 400 });

    if (!planCode) {
      return NextResponse.json({ error: 'Plan not configured for this tier' }, { status: 400 });
    }

    // Get user email
    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const callbackUrl = new URL('/settings?tab=billing', process.env.NEXT_PUBLIC_APP_URL || request.url).href;
    
    // Direct Paystack API call to bypass TypeScript module issue
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack not configured' }, { status: 500 });
    }

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      signal: AbortSignal.timeout(15000),
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userEmail,
        amount,
        currency: 'GHS',
        callback_url: callbackUrl,
        metadata: { 
          organizationId: orgId, 
          tier, 
          interval,
          userId: user.sub
        },
        channels: ['card', 'mobile_money', 'bank_transfer', 'ussd'],
        plan: planCode,
      }),
    });

    const json = await res.json();
    if (!res.ok || json?.status === false) {
      throw new Error(json?.message || `Paystack request failed: ${res.status}`);
    }

    await query("INSERT INTO payments (reference, email, amount, status, tier, organization_id) VALUES ($1,$2,$3,'pending',$4,$5)", [json.data.reference, userEmail, amount, tier, orgId]);
    return NextResponse.json(json.data);
  } catch (err: any) {
    console.error('Initialize error:', err);
    return NextResponse.json({ error: 'Unable to start checkout. Please try again later.' }, { status: 502 });
  }
}