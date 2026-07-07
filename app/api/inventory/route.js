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
      'SELECT * FROM inventory WHERE owner_id = $1 AND updated_at > $2 ORDER BY updated_at ASC LIMIT $3',
      [user.sub, updatedAfter, limit]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const { id, name, category, quantity, unit, low_stock_threshold, unit_price, supplier } = data;
    
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required for id' }, { status: 400 });
    }
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    if (quantity !== undefined && quantity < 0) {
      return NextResponse.json({ error: 'Quantity cannot be negative' }, { status: 400 });
    }
    
    if (unit_price !== undefined && unit_price < 0) {
      return NextResponse.json({ error: 'Unit price cannot be negative' }, { status: 400 });
    }
    
    const owner_id = user.sub;

    const { rows } = await query(
      `INSERT INTO inventory (id, name, category, quantity, unit, low_stock_threshold, unit_price, supplier, owner_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, category = EXCLUDED.category, quantity = EXCLUDED.quantity, unit = EXCLUDED.unit,
       low_stock_threshold = EXCLUDED.low_stock_threshold, unit_price = EXCLUDED.unit_price, supplier = EXCLUDED.supplier, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id || null, name, category || 'Uncategorized', quantity || 0, unit || 'unit', low_stock_threshold || 0, unit_price || 0, supplier || null, owner_id]
    );
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}
