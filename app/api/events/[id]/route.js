import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PUT(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required' }, { status: 400 });
    }

    const data = await request.json();
    const { subject, details, event_date, category, goat_ids, image_url, inventory_item_id, quantity_used } = data;

    if (!subject || subject.trim() === '') {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    const owner_id = user.sub;
    const sanitizedGoatIds = Array.isArray(goat_ids) ? goat_ids.filter(gid => UUID_REGEX.test(gid)) : [];

    const client = await (await import('@/lib/db')).getClient();
    let event;
    try {
      await client.query('BEGIN');

      // Generate smart keywords using Postgres FTS
      const tsResult = await client.query("SELECT array_agg(lexeme) as kws FROM unnest(to_tsvector('english', $1))", [subject]);
      const smartKeywords = tsResult.rows[0]?.kws || [];
      const formattedKeywords = JSON.stringify(smartKeywords);

      const { rows } = await client.query(
        `UPDATE farm_events 
         SET subject = $1, details = $2, event_date = $3, category = $4, keywords = $5::jsonb, 
             image_url = $6, inventory_item_id = $7, quantity_used = $8, updated_at = CURRENT_TIMESTAMP
         WHERE id = $9 AND owner_id = $10 RETURNING *`,
        [subject.trim(), details || '', event_date || new Date().toISOString(), category || 'General', formattedKeywords, 
         image_url || null, inventory_item_id || null, quantity_used || null, id, owner_id]
      );

      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Record not found or unauthorized' }, { status: 404 });
      }

      event = rows[0];

      // Atomically sync junction table farm_event_goats
      await client.query(`DELETE FROM farm_event_goats WHERE event_id = $1 AND owner_id = $2`, [id, owner_id]);

      if (sanitizedGoatIds.length > 0) {
        for (const goatId of sanitizedGoatIds) {
          await client.query(
            `INSERT INTO farm_event_goats (id, event_id, goat_id, owner_id)
             VALUES (gen_random_uuid(), $1, $2, $3)
             ON CONFLICT (event_id, goat_id) DO NOTHING`,
            [id, goatId, owner_id]
          );
        }
      }
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    event.goat_ids = sanitizedGoatIds;
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating farm event:', error);
    return NextResponse.json({ error: 'Failed to update farm event' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required' }, { status: 400 });
    }

    const { rowCount } = await query('DELETE FROM farm_events WHERE id = $1 AND owner_id = $2', [id, user.sub]);

    if (rowCount === 0) return NextResponse.json({ error: 'Record not found or unauthorized' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting farm event:', error);
    return NextResponse.json({ error: 'Failed to delete farm event' }, { status: 500 });
  }
}
