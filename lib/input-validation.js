export function isValidRecordDate(value) {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)||!Number.isFinite(Date.parse(value))) return false;
  const day=value.slice(0,10);const parsed=new Date(day+'T00:00:00Z');return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===day;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const recordApi = new RegExp('^/api/(?:app/)?(?:goats|health(?:_records)?|breeding(?:_records)?|inventory|sales|milk(?:_records)?|weights|weight_records|expenditures|usage(?:_logs)?|alerts|events|farm_events|corrections)(?:/|$)');
export function validateRecordInput(path, body) {
  if (!recordApi.test(path)) return null;
  for (const key of ['id', 'goat_id', 'dam_id', 'sire_id']) {
    const value = body[key];
    if (value !== undefined && value !== null && value !== '' && (typeof value !== 'string' || !uuid.test(value))) return key + ' must be a valid UUID';
  }
  for (const key of ['dob', 'record_date', 'next_due_date', 'mating_date', 'expected_kidding_date', 'actual_kidding_date', 'sale_date', 'event_date']) {
    const value = body[key];
    if (value !== undefined && value !== null && value !== '' && (!isValidRecordDate(value))) return key + ' must be a valid date';
  }
  for (const key of ['cost', 'quantity', 'low_stock_threshold', 'min_quantity', 'unit_price', 'amount', 'kids_count', 'weight', 'volume', 'weight_kg', 'morning_yield', 'evening_yield', 'quantity_used', 'somatic_cell_count']) {
    const value = body[key];
    if (value !== undefined && value !== null && (typeof value !== 'number' && typeof value !== 'string' || !Number.isFinite(Number(value)) || Number(value) < 0)) return key + ' must be a non-negative number';
  }
  if (body.image_url && (typeof body.image_url !== 'string' || !new RegExp('^https?://').test(body.image_url))) return 'Photo URL must use HTTP or HTTPS';
  return null;
}
