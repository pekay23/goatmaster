import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request, { params }) {
  const { user, error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { id } = await params;
    const targetId = parseInt(id, 10);
    if (!targetId) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });

    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.role, u.subscription_tier, u.is_active, u.created_at,
              COUNT(DISTINCT g.id)::int as goat_count,
              COUNT(DISTINCT ge.id)::int as embedding_count,
              COUNT(DISTINCT s.id)::int as scan_count,
              COUNT(DISTINCT h.id)::int as health_log_count,
              COUNT(DISTINCT b.id)::int as breeding_log_count
       FROM users u
       LEFT JOIN goats g ON g.user_id = u.id
       LEFT JOIN goat_embeddings ge ON ge.goat_id = g.id
       LEFT JOIN scan_logs s ON s.user_id = u.id
       LEFT JOIN health_logs h ON h.goat_id = g.id
       LEFT JOIN breeding_logs b ON b.dam_id = g.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [targetId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('[admin/users/id GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { user, error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { id } = await params;
    const targetId = parseInt(id, 10);
    if (!targetId) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });

    // Safety: admin cannot demote themselves
    if (targetId === user.userId) {
      const body = await request.json();
      if (body.role && body.role !== 'admin') {
        return NextResponse.json({ error: 'Cannot demote yourself' }, { status: 400 });
      }
      // Allow other changes to self
      return applyUpdate(targetId, body);
    }

    const body = await request.json();
    return applyUpdate(targetId, body);
  } catch (err) {
    console.error('[admin/users/id PATCH]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function applyUpdate(targetId, body) {
  const allowed = ['role', 'subscription_tier', 'is_active'];
  const sets = [];
  const values = [];
  let i = 1;

  for (const key of allowed) {
    if (body[key] !== undefined) {
      sets.push(`${key} = $${i++}`);
      values.push(body[key]);
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  values.push(targetId);
  const { rows } = await pool.query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${i}
     RETURNING id, username, role, subscription_tier, is_active`,
    values
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
