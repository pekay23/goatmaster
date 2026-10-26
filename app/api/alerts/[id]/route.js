import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
    const data = await request.json();
    
    // Only support marking as read for now
    if (data.is_read !== undefined) {
      const { rows } = await query(
        `UPDATE alerts SET is_read = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND owner_id = $3 RETURNING *`,
        [data.is_read, id, user.sub]
      );
      if (rows.length === 0) return NextResponse.json({ error: 'Alert not found or unauthorized' }, { status: 404 });
      return NextResponse.json(rows[0]);
    }
    
    return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
    const { rowCount } = await query('DELETE FROM alerts WHERE id = $1 AND owner_id = $2', [id, user.sub]);
    
    if (rowCount === 0) return NextResponse.json({ error: 'Alert not found or unauthorized' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
  }
}
