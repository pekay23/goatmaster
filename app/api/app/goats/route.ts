import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sex = searchParams.get('sex') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 100);
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE organization_id = $1';
    const params: any[] = [user.orgId];
    let paramIndex = 2;

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR ear_tag ILIKE $${paramIndex} OR breed ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (sex) {
      whereClause += ` AND sex = $${paramIndex}`;
      params.push(sex);
      paramIndex++;
    }
    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const countResult = await query(`SELECT COUNT(*) as count FROM goats ${whereClause}`, params);
    const total = parseInt(countResult.rows[0]?.count || '0');

    params.push(limit, offset);
    const result = await query(
      `SELECT * FROM goats ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return NextResponse.json({
      goats: result.rows,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (err) {
    console.error('Goats list error:', err);
    return NextResponse.json({ error: 'Failed to load goats' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, breed, sex, dob, ear_tag, image_url, dam_id, sire_id } = body;

    if (!name || !sex) {
      return NextResponse.json({ error: 'Name and sex are required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO goats (organization_id, name, breed, sex, dob, ear_tag, image_url, dam_id, sire_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
       RETURNING *`,
      [user.orgId, name, breed, sex, dob, ear_tag, image_url, dam_id, sire_id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('Create goat error:', err);
    return NextResponse.json({ error: 'Failed to create goat' }, { status: 500 });
  }
}