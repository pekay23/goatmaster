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
    const type = searchParams.get('type') || '';
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 100);
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE hr.organization_id = $1';
    const params: any[] = [user.orgId];
    let paramIndex = 2;

    if (search) {
      whereClause += ` AND (g.name ILIKE $${paramIndex} OR hr.treatment ILIKE $${paramIndex} OR hr.notes ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (type) {
      whereClause += ` AND hr.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) as count FROM health_records hr 
       JOIN goats g ON g.id = hr.goat_id 
       ${whereClause}`, 
      params
    );
    const total = parseInt(countResult.rows[0]?.count || '0');

    params.push(limit, offset);
    const result = await query(
      `SELECT hr.*, g.name as goat_name 
       FROM health_records hr
       JOIN goats g ON g.id = hr.goat_id
       ${whereClause} 
       ORDER BY hr.record_date DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return NextResponse.json({
      records: result.rows,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (err) {
    console.error('Health records error:', err);
    return NextResponse.json({ error: 'Failed to load records' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { goat_id, type, notes, treatment, cost, record_date, next_due_date } = body;

    if (!goat_id || !type) {
      return NextResponse.json({ error: 'Goat and type are required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO health_records (organization_id, goat_id, type, notes, treatment, cost, record_date, next_due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user.orgId, goat_id, type, notes, treatment, cost || 0, record_date || new Date().toISOString(), next_due_date]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('Create health record error:', err);
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}