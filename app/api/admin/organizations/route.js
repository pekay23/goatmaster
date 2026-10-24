import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
      whereClause = 'WHERE (name ILIKE $1 OR slug ILIKE $1)';
      params.push(`%${search}%`);
    }

    const countResult = await query(`SELECT COUNT(*) as count FROM organizations ${whereClause}`, params);
    const total = parseInt(countResult.rows[0]?.count || 0);

    const params2 = [...params, limit, offset];
    const result = await query(
      `SELECT o.*, (SELECT COUNT(*) FROM users u WHERE u.org_id = o.id) as member_count
       FROM organizations o ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      params2
    );

    return NextResponse.json({ organizations: result.rows, total, totalPages: Math.ceil(total / limit), page });
  } catch (err) {
    console.error('Admin organizations error:', err);
    return NextResponse.json({ error: 'Failed to load organizations' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, slug, tier, custom_domain } = await request.json();
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }
    const { rows } = await query(
      `INSERT INTO organizations (name, slug, tier, custom_domain)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, slug, tier || 'free', custom_domain || null]
    );
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Admin create org error:', err);
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
  }
}
