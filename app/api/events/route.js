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
      `SELECT e.*, 
              COALESCE(
                (SELECT json_agg(feg.goat_id) 
                 FROM farm_event_goats feg 
                 WHERE feg.event_id = e.id),
                '[]'::json
              ) AS goat_ids
       FROM farm_events e
       WHERE e.owner_id = $1 AND e.updated_at > $2
       ORDER BY e.updated_at ASC LIMIT $3`,
      [user.sub, updatedAfter, limit]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching farm events:', error);
    return NextResponse.json({ error: 'Failed to fetch farm events' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const { id, subject, details, event_date, category, goat_ids, image_url, inventory_item_id, quantity_used } = data;

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required for id' }, { status: 400 });
    }

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

      // Check if event already exists to handle inventory idempotency
      const existing = await client.query('SELECT id FROM farm_events WHERE id = $1', [id]);
      const isNew = existing.rows.length === 0;

      // Save/update main event record
      const { rows } = await client.query(
        `INSERT INTO farm_events (id, owner_id, subject, details, event_date, category, keywords, image_url, inventory_item_id, quantity_used) 
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10) 
         ON CONFLICT (id) DO UPDATE SET
         subject = EXCLUDED.subject, details = EXCLUDED.details, event_date = EXCLUDED.event_date,
         category = EXCLUDED.category, keywords = EXCLUDED.keywords, image_url = EXCLUDED.image_url,
         inventory_item_id = EXCLUDED.inventory_item_id, quantity_used = EXCLUDED.quantity_used,
         updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          id, owner_id, subject.trim(), details || '', event_date || new Date().toISOString(), category || 'General', formattedKeywords,
          image_url || null, inventory_item_id || null, quantity_used || null
        ]
      );

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

      // Handle inventory reduction if this is a new event and inventory was used
      if (isNew && inventory_item_id && quantity_used > 0) {
        // Fetch inventory item to get its name
        const invRes = await client.query('SELECT name, unit FROM inventory WHERE id = $1 AND owner_id = $2', [inventory_item_id, owner_id]);
        if (invRes.rows.length > 0) {
          const inv = invRes.rows[0];
          
          // Create usage log
          await client.query(
            `INSERT INTO usage_logs (id, inventory_item_id, item_name, quantity_used, unit, notes, logged_at, owner_id)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)`,
            [inventory_item_id, inv.name, quantity_used, inv.unit, `Used in event: ${subject}`, event_date || new Date().toISOString(), owner_id]
          );

          // Decrement inventory
          await client.query(
            `UPDATE inventory SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND owner_id = $3`,
            [quantity_used, inventory_item_id, owner_id]
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
    console.error('Error creating farm event:', error);
    return NextResponse.json({ error: 'Failed to create farm event' }, { status: 500 });
  }
}
