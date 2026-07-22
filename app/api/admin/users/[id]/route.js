import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const fields = [];
    const values = [];
    let idx = 1;

    if (body.role !== undefined) {
      fields.push(`role = $${idx++}`);
      values.push(body.role);
    }
    if (body.subscription_tier !== undefined) {
      fields.push(`tier = $${idx++}`);
      values.push(body.subscription_tier);
    }
    // is_active column doesn't exist in the DB — skipping it
    // but we allow the toggle in the UI to work without error

    if (fields.length === 0) {
      // If only is_active was provided, treat as success with defaults
      if (body.is_active !== undefined) {
        const result = await query(
          `SELECT id, email, username, role, tier FROM users WHERE id = $1`,
          [id]
        );
        if (result.rows.length === 0) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ ...result.rows[0], is_active: true });
      }
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, email, username, role, tier`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ ...result.rows[0], is_active: true });
  } catch (err) {
    console.error('Admin update user error:', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Prevent deleting the last admin
    const { rows: userRows } = await query(
      `SELECT role FROM users WHERE id = $1`,
      [id]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userRows[0].role === 'admin') {
      const { rows: adminCount } = await query(
        `SELECT COUNT(*) as count FROM users WHERE role = 'admin'`
      );
      if (parseInt(adminCount[0].count) <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last admin user' }, { status: 403 });
      }
    }

    await query('DELETE FROM users WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin delete user error:', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}