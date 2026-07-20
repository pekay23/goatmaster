import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function deterministicV4Uuid(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const bytes = [];
  for (let i = 0; i < 16; i += 1) {
    hash ^= hash << 13;
    hash ^= hash >>> 17;
    hash ^= hash << 5;
    bytes.push(hash & 0xff);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function ensureTreatmentDueAlerts(ownerId) {
  const { rows: dueRecords } = await query(
    `SELECT h.id, h.goat_id, h.treatment, h.next_due_date, g.name AS goat_name
     FROM health_records h
     LEFT JOIN goats g ON g.id = h.goat_id
     WHERE h.owner_id = $1
       AND h.next_due_date IS NOT NULL
       AND h.next_due_date::date <= (CURRENT_DATE + INTERVAL '7 days')
     ORDER BY h.next_due_date ASC`,
    [ownerId]
  );

  for (const record of dueRecords) {
    const dueDate = new Date(record.next_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const overdue = dueDate < today;
    const formattedDate = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const goatName = record.goat_name || 'Goat';
    const treatment = record.treatment || 'Scheduled treatment';

    await query(
      `INSERT INTO alerts (id, owner_id, type, title, message, related_entity_id, related_entity_type)
       VALUES ($1, $2, $3, $4, $5, $6, 'health_record')
       ON CONFLICT (id) DO UPDATE SET
         type = EXCLUDED.type,
         title = EXCLUDED.title,
         message = EXCLUDED.message,
         related_entity_id = EXCLUDED.related_entity_id,
         related_entity_type = EXCLUDED.related_entity_type,
         updated_at = CURRENT_TIMESTAMP`,
      [
        deterministicV4Uuid(`health-due:${record.id}`),
        ownerId,
        overdue ? 'urgent' : 'warning',
        overdue ? `${goatName} treatment overdue` : `${goatName} treatment due soon`,
        `${treatment} is ${overdue ? 'overdue' : 'due'} on ${formattedDate}.`,
        record.id
      ]
    );
  }
}

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureTreatmentDueAlerts(user.sub);

    const { searchParams } = new URL(request.url);
    const updatedAfter = searchParams.get('updated_after') || '1970-01-01T00:00:00Z';
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    const { rows } = await query(
      'SELECT * FROM alerts WHERE owner_id = $1 AND updated_at > $2 ORDER BY updated_at ASC LIMIT $3',
      [user.sub, updatedAfter, limit]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const { id, type, title, message, related_entity_id, related_entity_type } = data;
    
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required for id' }, { status: 400 });
    }
    
    const owner_id = user.sub;

    const { rows } = await query(
      `INSERT INTO alerts (id, type, title, message, related_entity_id, related_entity_type, owner_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title, message = EXCLUDED.message, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id || null, type, title, message, related_entity_id || null, related_entity_type || null, owner_id]
    );
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}
