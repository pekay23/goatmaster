import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await query(
      `SELECT * FROM scan_history 
       WHERE organization_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [user.orgId]
    );

    return NextResponse.json({ scans: result.rows });
  } catch (err) {
    console.error('Scan history error:', err);
    return NextResponse.json({ error: 'Failed to load scan history' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { goat_id, goat_name, confidence, detected, method } = body;

    await query(
      `INSERT INTO scan_history (organization_id, goat_id, goat_name, confidence, detected, method)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.orgId, goat_id, goat_name, confidence, detected, method]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Scan history create error:', err);
    return NextResponse.json({ error: 'Failed to save scan' }, { status: 500 });
  }
}
