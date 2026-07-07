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
      'SELECT * FROM breeding_records WHERE owner_id = $1 AND updated_at > $2 ORDER BY updated_at ASC LIMIT $3',
      [user.sub, updatedAfter, limit]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching breeding records:', error);
    return NextResponse.json({ error: 'Failed to fetch breeding records' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const { id, dam_id, sire_id, mating_date, expected_kidding_date, actual_kidding_date, kids_count, notes, status } = data;
    
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required for id' }, { status: 400 });
    }
    
    const owner_id = user.sub;

    const { rows } = await query(
      `INSERT INTO breeding_records (id, dam_id, sire_id, mating_date, expected_kidding_date, actual_kidding_date, kids_count, notes, status, owner_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       ON CONFLICT (id) DO UPDATE SET
       sire_id = EXCLUDED.sire_id, mating_date = EXCLUDED.mating_date, expected_kidding_date = EXCLUDED.expected_kidding_date,
       actual_kidding_date = EXCLUDED.actual_kidding_date, kids_count = EXCLUDED.kids_count, notes = EXCLUDED.notes,
       status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id || null, dam_id, sire_id || null, mating_date || null, expected_kidding_date || null, actual_kidding_date || null, kids_count || 0, notes || null, status || 'planned', owner_id]
    );
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error creating breeding record:', error);
    return NextResponse.json({ error: 'Failed to create breeding record' }, { status: 500 });
  }
}
