import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    if (search) {
      whereClause = 'WHERE (email ILIKE $1 OR username ILIKE $1)';
      params.push(`%${search}%`);
    }

    const countResult = await query(`SELECT COUNT(*) as count FROM users ${whereClause}`, params);
    const total = parseInt(countResult.rows[0]?.count || 0);

    const params2 = [...params, limit, offset];
    const result = await query(
      `SELECT id, email, username, role, COALESCE(tier, 'free') as subscription_tier, true as is_active, created_at,
        (SELECT COUNT(*) FROM goats WHERE owner_id = users.username) as goat_count
      FROM users ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      params2
    );

    return NextResponse.json({
      users: result.rows,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    });
  } catch (err) {
    console.error('Admin users error:', err);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { email, password, username, role, tier } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Email, password, and username are required' }, { status: 400 });
    }

    // Check for existing email
    const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const password_hash = await hashPassword(password);
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, username, role, tier)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, username, role, tier, created_at`,
      [email, password_hash, username, role || 'user', tier || 'free']
    );

    return NextResponse.json({ data: rows[0], is_active: true }, { status: 201 });
  } catch (err) {
    console.error('Admin create user error:', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}