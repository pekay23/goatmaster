import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const { rows } = await query(
      `SELECT o.*, (SELECT COUNT(*) FROM users u WHERE u.org_id = o.id) as member_count
       FROM organizations o WHERE o.id = $1`,
      [id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const members = await query(
      `SELECT id, email, username, role, tier FROM users WHERE org_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    return NextResponse.json({ organization: rows[0], members: members.rows });
  } catch (err) {
    console.error('Admin org detail error:', err);
    return NextResponse.json({ error: 'Failed to load organization' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const { name, slug, tier, custom_domain } = await request.json();
    const { rows } = await query(
      `UPDATE organizations SET name = COALESCE($2, name), slug = COALESCE($3, slug),
       tier = COALESCE($4, tier), custom_domain = COALESCE($5, custom_domain), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, name, slug, tier, custom_domain]
    );
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('Admin update org error:', err);
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await query('DELETE FROM organizations WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin delete org error:', err);
    return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 });
  }
}
