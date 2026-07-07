import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const data = await request.json();
    const { name, category, quantity, unit, low_stock_threshold, unit_price, supplier } = data;
    
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const { rows } = await query(
      `UPDATE inventory 
       SET name = $1, category = $2, quantity = $3, unit = $4, low_stock_threshold = $5, unit_price = $6, supplier = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND owner_id = $9 RETURNING *`,
      [name, category || 'Uncategorized', quantity || 0, unit || 'unit', low_stock_threshold || 0, unit_price || 0, supplier || null, id, user.sub]
    );
    
    if (rows.length === 0) return NextResponse.json({ error: 'Inventory item not found or unauthorized' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const { rows } = await query('DELETE FROM inventory WHERE id = $1 AND owner_id = $2 RETURNING *', [id, user.sub]);
    
    if (rows.length === 0) return NextResponse.json({ error: 'Inventory item not found or unauthorized' }, { status: 404 });
    return NextResponse.json({ success: true, deleted: rows[0] });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}
