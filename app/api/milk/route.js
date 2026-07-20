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
      'SELECT * FROM milk_records WHERE owner_id = $1 AND updated_at > $2 ORDER BY updated_at ASC LIMIT $3',
      [user.sub, updatedAfter, limit]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching milk records:', error);
    return NextResponse.json({ error: 'Failed to fetch milk records' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const { id, goat_id, record_date, morning_yield, evening_yield, somatic_cell_count, notes } = data;
    
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required for id' }, { status: 400 });
    }
    
    if (!goat_id || !UUID_REGEX.test(goat_id)) {
      return NextResponse.json({ error: 'Valid UUID is required for goat_id' }, { status: 400 });
    }
    
    if ((morning_yield !== null && morning_yield < 0) || (evening_yield !== null && evening_yield < 0)) {
      return NextResponse.json({ error: 'Yields cannot be negative' }, { status: 400 });
    }
    
    const owner_id = user.sub;

    const { rows } = await query(
      `INSERT INTO milk_records (id, goat_id, record_date, morning_yield, evening_yield, somatic_cell_count, notes, owner_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       ON CONFLICT (id) DO UPDATE SET
       goat_id = EXCLUDED.goat_id, record_date = EXCLUDED.record_date, 
       morning_yield = EXCLUDED.morning_yield, evening_yield = EXCLUDED.evening_yield,
       somatic_cell_count = EXCLUDED.somatic_cell_count, notes = EXCLUDED.notes,
       updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, goat_id, record_date || null, morning_yield || 0, evening_yield || 0, somatic_cell_count || null, notes || '', owner_id]
    );
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error creating milk record:', error);
    return NextResponse.json({ error: 'Failed to create milk record' }, { status: 500 });
  }
}
