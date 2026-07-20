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
      'SELECT * FROM goats WHERE owner_id = $1 AND updated_at > $2 ORDER BY updated_at ASC LIMIT $3',
      [user.sub, updatedAfter, limit]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching goats:', error);
    return NextResponse.json({ error: 'Failed to fetch goats' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const { id, name, breed, sex, dob, image_url, ear_tag, dam_id, sire_id } = data;
    
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required for id' }, { status: 400 });
    }
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    const owner_id = user.sub;

    if (dam_id && !UUID_REGEX.test(dam_id)) {
      return NextResponse.json({ error: 'Valid UUID is required for dam_id' }, { status: 400 });
    }

    if (sire_id && !UUID_REGEX.test(sire_id)) {
      return NextResponse.json({ error: 'Valid UUID is required for sire_id' }, { status: 400 });
    }

    if (dam_id && dam_id === id) {
      return NextResponse.json({ error: 'A goat cannot be its own dam' }, { status: 400 });
    }

    if (sire_id && sire_id === id) {
      return NextResponse.json({ error: 'A goat cannot be its own sire' }, { status: 400 });
    }

    const { rows } = await query(
      `INSERT INTO goats (id, name, breed, sex, dob, image_url, ear_tag, dam_id, sire_id, owner_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, breed = EXCLUDED.breed, sex = EXCLUDED.sex, dob = EXCLUDED.dob,
       image_url = EXCLUDED.image_url, ear_tag = EXCLUDED.ear_tag,
       dam_id = EXCLUDED.dam_id, sire_id = EXCLUDED.sire_id,
       updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id || null, name, breed, sex, dob || null, image_url || null, ear_tag || null, dam_id || null, sire_id || null, owner_id]
    );
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error creating goat:', error);
    return NextResponse.json({ error: 'Failed to create goat' }, { status: 500 });
  }
}
