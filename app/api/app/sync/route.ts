import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { entity, entityId, type, data, vectorClock } = body;

    if (!entity || !entityId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert into sync queue
    await query(
      `INSERT INTO sync_queue (organization_id, entity, entity_id, operation, data, vector_clock, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [user.orgId, entity, entityId, type, JSON.stringify(data), JSON.stringify(vectorClock || {})]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Sync queue error:', err);
    return NextResponse.json({ error: 'Failed to queue sync' }, { status: 500 });
  }
}

export async function GET() {
  const user = await getAuthUser();
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await query(
      `SELECT * FROM sync_queue 
       WHERE organization_id = $1 AND status = 'pending'
       ORDER BY created_at ASC
       LIMIT 100`,
      [user.orgId]
    );

    return NextResponse.json({ queue: result.rows });
  } catch (err) {
    console.error('Sync queue fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
  }
}