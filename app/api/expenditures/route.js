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
      'SELECT * FROM expenditures WHERE owner_id = $1 AND updated_at > $2 ORDER BY updated_at ASC LIMIT $3',
      [user.sub, updatedAfter, limit]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching expenditures:', error);
    return NextResponse.json({ error: 'Failed to fetch expenditures' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const { id, amount, category, description, inventory_item_id, spent_at } = data;
    
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required for id' }, { status: 400 });
    }
    
    if (amount !== undefined && amount < 0) {
      return NextResponse.json({ error: 'Amount cannot be negative' }, { status: 400 });
    }
    
    const owner_id = user.sub;

    const { rows } = await query(
      `INSERT INTO expenditures (id, amount, category, description, inventory_item_id, spent_at, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (id) DO UPDATE SET
       amount = EXCLUDED.amount, category = EXCLUDED.category, description = EXCLUDED.description, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id || null, amount, category, description || null, inventory_item_id || null, spent_at || new Date().toISOString(), owner_id]
    );

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error creating expenditure:', error);
    return NextResponse.json({ error: 'Failed to create expenditure' }, { status: 500 });
  }
}
