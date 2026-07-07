import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    let sql = '';
    let rows = [];

    switch (type) {
      case 'herd':
        ({ rows } = await query('SELECT name, breed, sex, dob, ear_tag, created_at FROM goats ORDER BY created_at DESC', []));
        break;
      case 'health':
        // Dummy health reports until a health table is added
        rows = [
          { status: 'Healthy', notes: 'No active issues', date: new Date().toISOString() }
        ];
        break;
      case 'breeding':
        // Dummy breeding reports
        rows = [];
        break;
      case 'inventory':
        ({ rows } = await query('SELECT name, category, quantity, unit, low_stock_threshold, unit_price, supplier FROM inventory ORDER BY name ASC', []));
        break;
      case 'sales':
        ({ rows } = await query('SELECT customer, amount, contact_info, sale_date FROM sales ORDER BY sale_date DESC', []));
        break;
      default:
        ({ rows } = await query('SELECT * FROM goats ORDER BY created_at DESC', []));
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
