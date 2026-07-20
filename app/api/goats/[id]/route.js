import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PUT(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const data = await request.json();
    const { name, breed, sex, dob, image_url, ear_tag, dam_id, sire_id } = data;
    
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

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
      `UPDATE goats 
       SET name = $1, breed = $2, sex = $3, dob = $4, image_url = $5, ear_tag = $6,
           dam_id = $7, sire_id = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND owner_id = $10 RETURNING *`,
      [name, breed, sex, dob || null, image_url || null, ear_tag || null, dam_id || null, sire_id || null, id, user.sub]
    );
    
    if (rows.length === 0) return NextResponse.json({ error: 'Goat not found or unauthorized' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating goat:', error);
    return NextResponse.json({ error: 'Failed to update goat' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const { rows } = await query('DELETE FROM goats WHERE id = $1 AND owner_id = $2 RETURNING *', [id, user.sub]);
    
    if (rows.length === 0) return NextResponse.json({ error: 'Goat not found or unauthorized' }, { status: 404 });
    return NextResponse.json({ success: true, deleted: rows[0] });
  } catch (error) {
    console.error('Error deleting goat:', error);
    return NextResponse.json({ error: 'Failed to delete goat' }, { status: 500 });
  }
}
