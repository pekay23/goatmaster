import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
    const { rowCount } = await query('DELETE FROM usage_logs WHERE id = $1 AND owner_id = $2', [id, user.sub]);
    if (rowCount === 0) return NextResponse.json({ error: 'Usage log not found or unauthorized' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting usage log:', error);
    return NextResponse.json({ error: 'Failed to delete usage log' }, { status: 500 });
  }
}
