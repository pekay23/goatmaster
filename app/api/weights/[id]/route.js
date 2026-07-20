import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PUT(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = params.id;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required' }, { status: 400 });
    }

    const data = await request.json();
    const { goat_id, record_date, weight_kg, notes } = data;
    
    if (!goat_id || !UUID_REGEX.test(goat_id)) {
      return NextResponse.json({ error: 'Valid UUID is required for goat_id' }, { status: 400 });
    }

    if (weight_kg !== undefined && (weight_kg === null || weight_kg < 0)) {
      return NextResponse.json({ error: 'Weight cannot be negative' }, { status: 400 });
    }

    const { rows } = await query(
      `UPDATE weight_records 
       SET goat_id = COALESCE($1, goat_id), 
           record_date = COALESCE($2, record_date), 
           weight_kg = COALESCE($3, weight_kg), 
           notes = COALESCE($4, notes), 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND owner_id = $6
       RETURNING *`,
      [goat_id, record_date, weight_kg, notes, id, user.sub]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Weight record not found or not owned by user' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating weight record:', error);
    return NextResponse.json({ error: 'Failed to update weight record' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = params.id;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required' }, { status: 400 });
    }

    const { rowCount } = await query(
      'DELETE FROM weight_records WHERE id = $1 AND owner_id = $2',
      [id, user.sub]
    );

    if (rowCount === 0) {
      return NextResponse.json({ error: 'Weight record not found or not owned by user' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting weight record:', error);
    return NextResponse.json({ error: 'Failed to delete weight record' }, { status: 500 });
  }
}
