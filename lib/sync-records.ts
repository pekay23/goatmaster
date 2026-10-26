export const syncRecords = {
  goats: ['name','breed','sex','dob','image_url','ear_tag','dam_id','sire_id','status'],
  inventory: ['name','category','quantity','unit','low_stock_threshold','unit_price','supplier'],
  sales: ['customer','amount','contact_info','items_data','sale_date'],
  health_records: ['goat_id','type','notes','treatment','cost','record_date','next_due_date'],
  breeding_records: ['dam_id','sire_id','mating_date','expected_kidding_date','actual_kidding_date','kids_count','notes','status'],
  alerts: ['type','title','message','is_read','related_entity_id','related_entity_type'],
  corrections: ['correction_type','source_goat_id','target_goat_id','notes','status'],
  usage_logs: ['inventory_item_id','item_name','quantity_used','unit','notes','logged_at'],
  expenditures: ['amount','category','description','inventory_item_id','spent_at'],
  milk_records: ['goat_id','record_date','morning_yield','evening_yield','somatic_cell_count','notes'],
  weight_records: ['goat_id','record_date','weight_kg','notes'],
  farm_events: ['subject','details','event_date','category','keywords','completed_at'],
} satisfies Record<string, string[]>;
export type SyncEntity = keyof typeof syncRecords;
export function isSyncEntity(value: unknown): value is SyncEntity { return typeof value === 'string' && Object.hasOwn(syncRecords, value); }
