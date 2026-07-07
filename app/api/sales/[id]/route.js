import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const { rows } = await query('DELETE FROM sales WHERE id = $1 AND owner_id = $2 RETURNING *', [id, user.sub]);
    
    if (rows.length === 0) return NextResponse.json({ error: 'Sale not found or unauthorized' }, { status: 404 });
    return NextResponse.json({ success: true, deleted: rows[0] });
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}
