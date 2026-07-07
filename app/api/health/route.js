import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const updatedAfter = searchParams.get('updated_after') || '1970-01-01T00:00:00Z';
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    const { rows } = await query(
      'SELECT * FROM health_records WHERE owner_id = $1 AND updated_at > $2 ORDER BY updated_at ASC LIMIT $3',
      [user.sub, updatedAfter, limit]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching health records:', error);
    return NextResponse.json({ error: 'Failed to fetch health records' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const { id, goat_id, type, notes, treatment, cost, record_date } = data;
    
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required for id' }, { status: 400 });
    }
    
    if (cost !== undefined && cost < 0) {
      return NextResponse.json({ error: 'Cost cannot be negative' }, { status: 400 });
    }
    
    const owner_id = user.sub;

    const { rows } = await query(
      `INSERT INTO health_records (id, goat_id, type, notes, treatment, cost, record_date, owner_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       ON CONFLICT (id) DO UPDATE SET
       type = EXCLUDED.type, notes = EXCLUDED.notes, treatment = EXCLUDED.treatment, cost = EXCLUDED.cost, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id || null, goat_id, type || 'general', notes || '', treatment || '', cost || 0, record_date || new Date().toISOString(), owner_id]
    );
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error creating health record:', error);
    return NextResponse.json({ error: 'Failed to create health record' }, { status: 500 });
  }
}
