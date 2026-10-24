import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { endpoint, keys } = await request.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid push subscription' }, { status: 400 });
    }

    const { rows } = await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         p256dh_key = EXCLUDED.p256dh_key,
         auth_key = EXCLUDED.auth_key,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [user.sub, endpoint, keys.p256dh, keys.auth]
    );

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error storing push subscription:', error);
    return NextResponse.json({ error: 'Failed to store push subscription' }, { status: 500 });
  }
}
