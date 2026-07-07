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
      'SELECT * FROM usage_logs WHERE owner_id = $1 AND updated_at > $2 ORDER BY updated_at ASC LIMIT $3',
      [user.sub, updatedAfter, limit]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching usage logs:', error);
    return NextResponse.json({ error: 'Failed to fetch usage logs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const { id, inventory_item_id, item_name, quantity_used, unit, notes, logged_at } = data;
    
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required for id' }, { status: 400 });
    }
    
    if (quantity_used !== undefined && quantity_used < 0) {
      return NextResponse.json({ error: 'Quantity used cannot be negative' }, { status: 400 });
    }
    
    const owner_id = user.sub;

    const client = await (await import('@/lib/db')).getClient();
    let result;
    
    try {
      await client.query('BEGIN');
      
      const existing = await client.query('SELECT id FROM usage_logs WHERE id = $1', [id]);
      const isNew = existing.rows.length === 0;

      const { rows } = await client.query(
        `INSERT INTO usage_logs (id, inventory_item_id, item_name, quantity_used, unit, notes, logged_at, owner_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
         notes = EXCLUDED.notes, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [id || null, inventory_item_id || null, item_name, quantity_used, unit || null, notes || null, logged_at || new Date().toISOString(), owner_id]
      );
      
      result = rows[0];

      // Only decrement inventory quantity if this is a brand new usage log (idempotency)
      if (isNew && inventory_item_id) {
        await client.query(
          `UPDATE inventory SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND owner_id = $3`,
          [quantity_used, inventory_item_id, owner_id]
        );
      }
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating usage log:', error);
    return NextResponse.json({ error: 'Failed to create usage log' }, { status: 500 });
  }
}
