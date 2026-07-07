import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const data = await request.json();
    const { name, breed, sex, dob, image_url, ear_tag } = data;
    
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const { rows } = await query(
      `UPDATE goats 
       SET name = $1, breed = $2, sex = $3, dob = $4, image_url = $5, ear_tag = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND owner_id = $8 RETURNING *`,
      [name, breed, sex, dob || null, image_url || null, ear_tag || null, id, user.sub]
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
