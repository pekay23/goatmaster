import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const data = await request.json();
    const { dam_id, sire_id, mating_date, expected_kidding_date, actual_kidding_date, kids_count, notes, status } = data;
    
    const { rows } = await query(
      `UPDATE breeding_records 
       SET dam_id = $1, sire_id = $2, mating_date = $3, expected_kidding_date = $4, actual_kidding_date = $5, kids_count = $6, notes = $7, status = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND owner_id = $10 RETURNING *`,
      [dam_id, sire_id || null, mating_date || null, expected_kidding_date || null, actual_kidding_date || null, kids_count || 0, notes || null, status || 'planned', id, user.sub]
    );
    
    if (rows.length === 0) return NextResponse.json({ error: 'Record not found or unauthorized' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating breeding record:', error);
    return NextResponse.json({ error: 'Failed to update breeding record' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { rowCount } = await query('DELETE FROM breeding_records WHERE id = $1 AND owner_id = $2', [id, user.sub]);
    
    if (rowCount === 0) return NextResponse.json({ error: 'Record not found or unauthorized' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting breeding record:', error);
    return NextResponse.json({ error: 'Failed to delete breeding record' }, { status: 500 });
  }
}
