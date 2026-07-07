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
      'SELECT * FROM sales WHERE owner_id = $1 AND updated_at > $2 ORDER BY updated_at ASC LIMIT $3',
      [user.sub, updatedAfter, limit]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const { id, customer, amount, contact_info, items_data, deduct_inventory } = data;
    
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required for id' }, { status: 400 });
    }
    
    if (amount !== undefined && amount < 0) {
      return NextResponse.json({ error: 'Amount cannot be negative' }, { status: 400 });
    }
    
    const owner_id = user.sub;

    // Start transaction if we need to deduct inventory
    const client = await (await import('@/lib/db')).getClient();
    try {
      await client.query('BEGIN');
      
      const existing = await client.query('SELECT id FROM sales WHERE id = $1', [id]);
      const isNew = existing.rows.length === 0;

      const saleResult = await client.query(
        `INSERT INTO sales (id, customer, amount, contact_info, items_data, owner_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (id) DO UPDATE SET
         customer = EXCLUDED.customer, amount = EXCLUDED.amount, contact_info = EXCLUDED.contact_info, items_data = EXCLUDED.items_data, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [id || null, customer, amount || 0, contact_info || null, JSON.stringify(items_data || []), owner_id]
      );
      
      const newSale = saleResult.rows[0];
      
      if (isNew && deduct_inventory && items_data && items_data.length > 0) {
        for (const item of items_data) {
          // Attempt to deduct based on inventory name matching
          await client.query(
            `UPDATE inventory 
             SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP
             WHERE name = $2 AND owner_id = $3`,
            [item.qty || 1, item.name, owner_id]
          );
        }
      }
      
      await client.query('COMMIT');
      return NextResponse.json(newSale);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
  }
}
