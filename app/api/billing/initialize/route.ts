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
    const { tier, interval, orgId } = body;
    
    if (!tier || !interval) {
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
    const amount = tierData.price_cents;

    if (!planCode) {
      return NextResponse.json({ error: 'Plan not configured for this tier' }, { status: 400 });
    }

    // Get user email
    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`;
    
    // Direct Paystack API call to bypass TypeScript module issue
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack not configured' }, { status: 500 });
    }

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
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

    return NextResponse.json(json.data);
  } catch (err: any) {
    console.error('Initialize error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to initialize' }, { status: 500 });
  }
}