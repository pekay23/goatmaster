import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const data = await request.json();
    const { goat_id, type, notes, treatment, cost, record_date } = data;
    
    const { rows } = await query(
      `UPDATE health_records 
       SET goat_id = $1, type = $2, notes = $3, treatment = $4, cost = $5, record_date = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND owner_id = $8 RETURNING *`,
      [goat_id, type, notes || null, treatment || null, cost || 0, record_date || new Date().toISOString(), id, user.sub]
    );
    
    if (rows.length === 0) return NextResponse.json({ error: 'Record not found or unauthorized' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating health record:', error);
    return NextResponse.json({ error: 'Failed to update health record' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { rowCount } = await query('DELETE FROM health_records WHERE id = $1 AND owner_id = $2', [id, user.sub]);
    
    if (rowCount === 0) return NextResponse.json({ error: 'Record not found or unauthorized' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting health record:', error);
    return NextResponse.json({ error: 'Failed to delete health record' }, { status: 500 });
  }
}
