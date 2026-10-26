export const reminderSql = `WITH latest AS (
  SELECT DISTINCT ON (organization_id,goat_id,type) * FROM health_records
  WHERE deleted_at IS NULL AND (current_org_id() IS NULL OR organization_id=current_org_id())
  ORDER BY organization_id,goat_id,type,record_date DESC,created_at DESC
)
INSERT INTO alerts(id,organization_id,owner_id,type,title,message,related_entity_id,related_entity_type)
SELECT uuid_generate_v5(uuid_ns_url(),'health-due:'||h.id),h.organization_id,h.owner_id,
CASE WHEN h.next_due_date<CURRENT_DATE THEN 'urgent' ELSE 'warning' END,
g.name||CASE WHEN h.next_due_date<CURRENT_DATE THEN ' treatment overdue' ELSE ' treatment due soon' END,
COALESCE(h.treatment,h.type,'Treatment')||' is due on '||to_char(h.next_due_date,'DD Mon YYYY'),h.id::text,'health_record'
FROM latest h JOIN goats g ON g.id=h.goat_id AND g.organization_id=h.organization_id AND g.deleted_at IS NULL
WHERE h.next_due_date<=CURRENT_DATE+INTERVAL '7 days'
ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,message=EXCLUDED.message,type=EXCLUDED.type,deleted_at=NULL
WHERE (alerts.title,alerts.message,alerts.type,alerts.deleted_at) IS DISTINCT FROM (EXCLUDED.title,EXCLUDED.message,EXCLUDED.type,NULL::timestamptz);

INSERT INTO alerts(id,organization_id,owner_id,type,title,message,related_entity_id,related_entity_type)
SELECT uuid_generate_v5(uuid_ns_url(),'breeding-due:'||b.id),b.organization_id,b.owner_id,'warning',g.name||' kidding date approaching',
'Expected kidding date: '||to_char(b.expected_kidding_date,'DD Mon YYYY'),b.id::text,'breeding_record'
FROM breeding_records b JOIN goats g ON g.id=b.dam_id AND g.organization_id=b.organization_id AND g.deleted_at IS NULL
WHERE b.deleted_at IS NULL AND b.actual_kidding_date IS NULL AND b.status IN ('mated','confirmed') AND b.expected_kidding_date<=CURRENT_DATE+INTERVAL '7 days'
AND (current_org_id() IS NULL OR b.organization_id=current_org_id())
ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,message=EXCLUDED.message,deleted_at=NULL
WHERE (alerts.title,alerts.message,alerts.deleted_at) IS DISTINCT FROM (EXCLUDED.title,EXCLUDED.message,NULL::timestamptz);

INSERT INTO alerts(id,organization_id,owner_id,type,title,message,related_entity_id,related_entity_type)
SELECT uuid_generate_v5(uuid_ns_url(),'stock-low:'||i.id),i.organization_id,i.owner_id,'warning',i.name||' stock is low',
i.quantity||' '||COALESCE(i.unit,'units')||' remaining',i.id::text,'inventory'
FROM inventory i WHERE i.deleted_at IS NULL AND i.quantity<=i.low_stock_threshold AND (current_org_id() IS NULL OR i.organization_id=current_org_id())
ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,message=EXCLUDED.message,deleted_at=NULL
WHERE (alerts.title,alerts.message,alerts.deleted_at) IS DISTINCT FROM (EXCLUDED.title,EXCLUDED.message,NULL::timestamptz);

UPDATE alerts a SET deleted_at=NOW()
WHERE a.deleted_at IS NULL AND (current_org_id() IS NULL OR a.organization_id=current_org_id()) AND (
(a.related_entity_type='inventory' AND NOT EXISTS(SELECT 1 FROM inventory i WHERE i.id::text=a.related_entity_id AND i.deleted_at IS NULL AND i.quantity<=i.low_stock_threshold))
OR (a.related_entity_type='breeding_record' AND NOT EXISTS(SELECT 1 FROM breeding_records b WHERE b.id::text=a.related_entity_id AND b.deleted_at IS NULL AND b.actual_kidding_date IS NULL AND b.status IN ('mated','confirmed') AND b.expected_kidding_date<=CURRENT_DATE+INTERVAL '7 days'))
OR (a.related_entity_type='health_record' AND NOT EXISTS(SELECT 1 FROM health_records h WHERE h.id::text=a.related_entity_id AND h.deleted_at IS NULL AND h.next_due_date<=CURRENT_DATE+INTERVAL '7 days' AND NOT EXISTS(SELECT 1 FROM health_records newer WHERE newer.goat_id=h.goat_id AND newer.organization_id=h.organization_id AND newer.type=h.type AND newer.deleted_at IS NULL AND (newer.record_date,newer.created_at)>(h.record_date,h.created_at))))
);`;
