import { featureAccessError } from '@/lib/plan-access';
import { listRecords } from '../_listing';
import { apiError } from '../_records';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

const inventorySelect = `SELECT id, name, category, quantity, unit,
  low_stock_threshold AS min_quantity, unit_price, supplier, created_at, updated_at`;

export async function GET(request: Request) {
  const denied = await featureAccessError(request, 'inventory'); if (denied) return denied;
  const user = await getAuthUser(request);
  if (typeof user?.orgId !== 'string') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { return NextResponse.json(await listRecords(request, user.orgId, 'inventory')); }
  catch (error) { return apiError(error, 'Unable to load records'); }
}

export async function POST(request: Request) {
  const denied = await featureAccessError(request, 'inventory'); if (denied) return denied;
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const quantity = Number(body.quantity ?? 0);
    const minQuantity = Number(body.low_stock_threshold ?? body.min_quantity ?? 0);
    const unitPrice = Number(body.unit_price ?? 0);
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (![quantity, minQuantity, unitPrice].every(Number.isFinite) || quantity < 0 || minQuantity < 0 || unitPrice < 0) {
      return NextResponse.json({ error: 'Quantity, minimum quantity, and unit price must be non-negative numbers' }, { status: 400 });
    }
    const result = await query(
      `INSERT INTO inventory (owner_id, organization_id, name, category, quantity, unit, low_stock_threshold, unit_price, supplier)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, category, quantity, unit, low_stock_threshold AS min_quantity, unit_price, supplier, created_at, updated_at`,
      [user.sub, user.orgId, name, body.category || 'other', quantity, body.unit || 'unit', minQuantity, unitPrice, body.supplier || null]
    );
    return NextResponse.json({ item: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Create inventory item error:', error);
    return NextResponse.json({ error: 'Unable to create inventory item' }, { status: 500 });
  }
}
