import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { sanitiseString, sanitiseDate, requireFields } from '@/lib/validate';
import { checkGoatLimit } from '@/lib/tierLimits';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const { rows } = await pool.query(
      `SELECT g.*, COUNT(ge.id)::int as photo_count
       FROM goats g
       LEFT JOIN goat_embeddings ge ON g.id = ge.goat_id
       WHERE g.user_id = $1
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [user.userId]
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const { allowed, current, max } = await checkGoatLimit(user.userId);
    if (!allowed) {
      return NextResponse.json(
        { error: `Goat limit reached (${current}/${max}). Upgrade your plan.`, upgrade: true },
        { status: 403 }
      );
    }

    const body = await request.json();
    const fieldErr = requireFields(body, ['name']);
    if (fieldErr) return NextResponse.json({ error: fieldErr }, { status: 400 });

    const name     = sanitiseString(body.name, 100);
    const breed    = sanitiseString(body.breed, 100) || null;
    const sex      = ['F','M','W'].includes(body.sex) ? body.sex : 'F';
    const dob      = sanitiseDate(body.dob);
    const imageUrl = sanitiseString(body.image_url, 500) || null;
    const earTag   = sanitiseString(body.ear_tag, 50) || null;
    const qrCode   = sanitiseString(body.qr_code, 200) || null;

    const { rows } = await pool.query(
      `INSERT INTO goats (name, sex, breed, dob, image_url, ear_tag, qr_code, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, sex, breed, dob, imageUrl, earTag, qrCode, user.userId]
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
