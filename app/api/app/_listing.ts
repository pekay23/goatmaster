import { query } from '@/lib/db';
import { pagination } from './_records';

type Section = 'herd' | 'health' | 'breeding' | 'inventory' | 'events' | 'weights' | 'milk';
const config: Record<Section, { table: string; alias: string; from: string; select: string; search: string; filter?: string; responseKey: string; date: string }> = {
  herd: { table: 'goats', alias: 'r', from: 'goats r', select: 'r.*', search: "r.name ILIKE $2 OR COALESCE(r.ear_tag, '') ILIKE $2 OR COALESCE(r.breed, '') ILIKE $2", responseKey: 'goats', date: 'r.created_at' },
  health: { table: 'health_records', alias: 'r', from: 'health_records r JOIN goats g ON g.id = r.goat_id AND g.organization_id = r.organization_id AND g.deleted_at IS NULL', select: 'r.*, g.name AS goat_name', search: "g.name ILIKE $2 OR COALESCE(r.treatment, '') ILIKE $2 OR COALESCE(r.notes, '') ILIKE $2", filter: 'type', responseKey: 'records', date: 'r.record_date' },
  breeding: { table: 'breeding_records', alias: 'r', from: 'breeding_records r JOIN goats dam ON dam.id = r.dam_id AND dam.organization_id = r.organization_id AND dam.deleted_at IS NULL LEFT JOIN goats sire ON sire.id = r.sire_id AND sire.organization_id = r.organization_id AND sire.deleted_at IS NULL', select: 'r.*, dam.name AS dam_name, sire.name AS sire_name', search: "dam.name ILIKE $2 OR COALESCE(sire.name, '') ILIKE $2 OR COALESCE(r.notes, '') ILIKE $2", filter: 'status', responseKey: 'records', date: 'r.created_at' },
  inventory: { table: 'inventory', alias: 'r', from: 'inventory r', select: 'r.*, r.low_stock_threshold AS min_quantity', search: "r.name ILIKE $2 OR COALESCE(r.supplier, '') ILIKE $2", filter: 'category', responseKey: 'items', date: 'r.created_at' },
  events: { table: 'farm_events', alias: 'r', from: 'farm_events r', select: 'r.*', search: "r.subject ILIKE $2 OR COALESCE(r.details, '') ILIKE $2", filter: 'category', responseKey: 'records', date: 'r.event_date' },
  weights: { table: 'weight_records', alias: 'r', from: 'weight_records r JOIN goats g ON g.id = r.goat_id AND g.organization_id = r.organization_id AND g.deleted_at IS NULL', select: 'r.*, g.name AS goat_name', search: "g.name ILIKE $2 OR COALESCE(r.notes, '') ILIKE $2", responseKey: 'records', date: 'r.record_date' },
  milk: { table: 'milk_records', alias: 'r', from: 'milk_records r JOIN goats g ON g.id = r.goat_id AND g.organization_id = r.organization_id AND g.deleted_at IS NULL', select: 'r.*, g.name AS goat_name', search: "g.name ILIKE $2 OR COALESCE(r.notes, '') ILIKE $2", responseKey: 'records', date: 'r.record_date' },
};

export async function listRecords(request: Request, organizationId: string, section: Section) {
  const search = new URL(request.url).searchParams;
  const { page, limit, offset } = pagination(search);
  const item = config[section];
  const values: unknown[] = [organizationId, '%' + (search.get('search') || '').slice(0, 200) + '%'];
  let where = 'r.organization_id = $1 AND r.deleted_at IS NULL AND (' + item.search + ')';
  if (item.filter && search.get(item.filter)) { values.push(search.get(item.filter)); where += ` AND r.${item.filter} = $${values.length}`; }
  if (section === 'herd') for (const field of ['sex', 'status']) if (search.get(field)) { values.push(search.get(field)); where += ` AND r.${field} = $${values.length}`; }
  if (section === 'inventory' && search.get('filter') === 'low_stock') where += ' AND r.quantity <= r.low_stock_threshold';
  if (section === 'events' && search.get('filter') === 'upcoming') where += ' AND r.completed_at IS NULL AND r.event_date >= CURRENT_DATE';
  const count = await query(`SELECT COUNT(*)::int AS total FROM ${item.from} WHERE ${where}`, values);
  const order = search.get('sort') === 'name' && (section === 'herd' || section === 'inventory') ? 'r.name ASC, r.id ASC' : item.date + ' DESC, r.id DESC';
  const result = await query(`SELECT ${item.select} FROM ${item.from} WHERE ${where} ORDER BY ${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, limit, offset]);
  const summary = section === 'herd' ? await query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'active')::int AS active, COUNT(*) FILTER (WHERE status = 'pregnant')::int AS pregnant, COUNT(*) FILTER (WHERE status = 'for_sale')::int AS for_sale FROM goats WHERE organization_id = $1 AND deleted_at IS NULL`, [organizationId])
    : section === 'breeding' ? await query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'planned')::int AS planned, COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed, COUNT(*) FILTER (WHERE status = 'kidded' AND actual_kidding_date >= CURRENT_DATE - INTERVAL '30 days')::int AS kidded, COUNT(*) FILTER (WHERE status IN ('mated', 'confirmed') AND expected_kidding_date >= date_trunc('month', CURRENT_DATE) AND expected_kidding_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::int AS due_month FROM breeding_records WHERE organization_id = $1 AND deleted_at IS NULL`, [organizationId])
    : section === 'inventory' ? await query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE quantity <= low_stock_threshold)::int AS low_stock, COALESCE(SUM(quantity * unit_price), 0) AS value, COUNT(DISTINCT category)::int AS categories FROM inventory WHERE organization_id = $1 AND deleted_at IS NULL`, [organizationId])
    : await query(`SELECT COUNT(*)::int AS total FROM ${item.table} WHERE organization_id = $1 AND deleted_at IS NULL`, [organizationId]);
  return { [item.responseKey]: result.rows, total: count.rows[0].total, page, limit, totalPages: Math.ceil(count.rows[0].total / limit), stats: summary.rows[0] };
}
