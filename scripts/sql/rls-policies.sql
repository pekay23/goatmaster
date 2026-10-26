-- Tenant isolation policies. Run after scripts/migrate.js has completed.
-- The application sets these GUCs from verified proxy claims on every DB checkout.
CREATE OR REPLACE FUNCTION current_org_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_org_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION current_app_role() RETURNS TEXT AS $$
  SELECT COALESCE(NULLIF(current_setting('app.current_role', true), ''), 'anonymous');
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION set_org_context(p_org_id UUID, p_user_id UUID, p_role TEXT DEFAULT 'user') RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_org_id', COALESCE(p_org_id::text, ''), true);
  PERFORM set_config('app.current_user_id', COALESCE(p_user_id::text, ''), true);
  PERFORM set_config('app.current_role', COALESCE(NULLIF(p_role, ''), 'anonymous'), true);
END;
$$ LANGUAGE plpgsql;

ALTER TABLE goats ENABLE ROW LEVEL SECURITY; ALTER TABLE goats FORCE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY; ALTER TABLE inventory FORCE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY; ALTER TABLE sales FORCE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY; ALTER TABLE health_records FORCE ROW LEVEL SECURITY;
ALTER TABLE breeding_records ENABLE ROW LEVEL SECURITY; ALTER TABLE breeding_records FORCE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY; ALTER TABLE alerts FORCE ROW LEVEL SECURITY;
ALTER TABLE corrections ENABLE ROW LEVEL SECURITY; ALTER TABLE corrections FORCE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY; ALTER TABLE usage_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY; ALTER TABLE expenditures FORCE ROW LEVEL SECURITY;
ALTER TABLE milk_records ENABLE ROW LEVEL SECURITY; ALTER TABLE milk_records FORCE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY; ALTER TABLE weight_records FORCE ROW LEVEL SECURITY;
ALTER TABLE farm_events ENABLE ROW LEVEL SECURITY; ALTER TABLE farm_events FORCE ROW LEVEL SECURITY;
ALTER TABLE farm_event_goats ENABLE ROW LEVEL SECURITY; ALTER TABLE farm_event_goats FORCE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY; ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY; ALTER TABLE organization_members FORCE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY; ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY; ALTER TABLE push_subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY; ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY; ALTER TABLE impersonation_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE retention_offers ENABLE ROW LEVEL SECURITY; ALTER TABLE retention_offers FORCE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY; ALTER TABLE sync_queue FORCE ROW LEVEL SECURITY;
ALTER TABLE goat_embeddings ENABLE ROW LEVEL SECURITY; ALTER TABLE goat_embeddings FORCE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY; ALTER TABLE scan_history FORCE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY; ALTER TABLE payments FORCE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY; ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY; ALTER TABLE billing_events FORCE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY; ALTER TABLE subscription_history FORCE ROW LEVEL SECURITY;

-- Drop only policies managed by this file, preserving unrelated application policies.
DROP POLICY IF EXISTS goats_org_isolation ON goats;
DROP POLICY IF EXISTS inventory_org_isolation ON inventory;
DROP POLICY IF EXISTS sales_org_isolation ON sales;
DROP POLICY IF EXISTS health_records_org_isolation ON health_records;
DROP POLICY IF EXISTS breeding_records_org_isolation ON breeding_records;
DROP POLICY IF EXISTS alerts_org_isolation ON alerts;
DROP POLICY IF EXISTS corrections_org_isolation ON corrections;
DROP POLICY IF EXISTS usage_logs_org_isolation ON usage_logs;
DROP POLICY IF EXISTS expenditures_org_isolation ON expenditures;
DROP POLICY IF EXISTS milk_records_org_isolation ON milk_records;
DROP POLICY IF EXISTS weight_records_org_isolation ON weight_records;
DROP POLICY IF EXISTS farm_events_org_isolation ON farm_events;
DROP POLICY IF EXISTS farm_event_goats_org_isolation ON farm_event_goats;
DROP POLICY IF EXISTS users_org_isolation ON users;
DROP POLICY IF EXISTS org_members_org_isolation ON organization_members;
DROP POLICY IF EXISTS organizations_org_isolation ON organizations;
DROP POLICY IF EXISTS push_subscriptions_org_isolation ON push_subscriptions;
DROP POLICY IF EXISTS audit_logs_org_isolation ON audit_logs;
DROP POLICY IF EXISTS impersonation_sessions_org_isolation ON impersonation_sessions;
DROP POLICY IF EXISTS retention_offers_org_isolation ON retention_offers;
DROP POLICY IF EXISTS sync_queue_org_isolation ON sync_queue;
DROP POLICY IF EXISTS goat_embeddings_org_isolation ON goat_embeddings;
DROP POLICY IF EXISTS scan_history_org_isolation ON scan_history;
DROP POLICY IF EXISTS payments_org_isolation ON payments;
DROP POLICY IF EXISTS subscriptions_org_isolation ON subscriptions;
DROP POLICY IF EXISTS billing_events_org_isolation ON billing_events;
DROP POLICY IF EXISTS subscription_history_org_isolation ON subscription_history;

CREATE POLICY goats_org_isolation ON goats FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY inventory_org_isolation ON inventory FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY sales_org_isolation ON sales FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY health_records_org_isolation ON health_records FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY breeding_records_org_isolation ON breeding_records FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY alerts_org_isolation ON alerts FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY corrections_org_isolation ON corrections FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY usage_logs_org_isolation ON usage_logs FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY expenditures_org_isolation ON expenditures FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY milk_records_org_isolation ON milk_records FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY weight_records_org_isolation ON weight_records FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY farm_events_org_isolation ON farm_events FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY farm_event_goats_org_isolation ON farm_event_goats FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY users_org_isolation ON users FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY org_members_org_isolation ON organization_members FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY organizations_org_isolation ON organizations FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR id = current_org_id());
CREATE POLICY push_subscriptions_org_isolation ON push_subscriptions FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR user_id IN (SELECT id FROM users WHERE organization_id = current_org_id()))
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR user_id IN (SELECT id FROM users WHERE organization_id = current_org_id()));
CREATE POLICY audit_logs_org_isolation ON audit_logs FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY impersonation_sessions_org_isolation ON impersonation_sessions FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service'))
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service'));
CREATE POLICY retention_offers_org_isolation ON retention_offers FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY sync_queue_org_isolation ON sync_queue FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY goat_embeddings_org_isolation ON goat_embeddings FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY scan_history_org_isolation ON scan_history FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY payments_org_isolation ON payments FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY subscriptions_org_isolation ON subscriptions FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY billing_events_org_isolation ON billing_events FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());
CREATE POLICY subscription_history_org_isolation ON subscription_history FOR ALL
  USING (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id())
  WITH CHECK (current_app_role() IN ('admin', 'super_admin', 'service') OR organization_id = current_org_id());

-- Legacy write paths inherit only the verified request organization.
ALTER TABLE goats ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE inventory ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE sales ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE health_records ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE breeding_records ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE alerts ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE corrections ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE usage_logs ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE expenditures ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE milk_records ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE weight_records ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE farm_events ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE farm_event_goats ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE goat_embeddings ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE scan_history ALTER COLUMN organization_id SET DEFAULT current_org_id();

CREATE OR REPLACE FUNCTION enforce_goat_limit() RETURNS TRIGGER AS $$
DECLARE maximum INTEGER;
BEGIN
  IF current_app_role() IN ('admin', 'super_admin', 'service') THEN RETURN NEW; END IF;
  PERFORM id FROM organizations WHERE id = NEW.organization_id FOR UPDATE;
  SELECT t.max_goats INTO maximum FROM organizations o JOIN tiers t ON t.id = o.tier WHERE o.id = NEW.organization_id;
  IF maximum IS NULL THEN RAISE EXCEPTION 'Plan configuration unavailable' USING ERRCODE = '23514'; END IF;
  IF maximum >= 0 AND NOT EXISTS (SELECT 1 FROM goats WHERE id = NEW.id AND organization_id = NEW.organization_id)
    AND (SELECT count(*) FROM goats WHERE organization_id = NEW.organization_id AND deleted_at IS NULL) >= maximum
  THEN RAISE EXCEPTION 'Your plan goat limit has been reached' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS goats_plan_limit ON goats;
CREATE TRIGGER goats_plan_limit BEFORE INSERT ON goats FOR EACH ROW EXECUTE FUNCTION enforce_goat_limit();

CREATE OR REPLACE FUNCTION enforce_goat_organization() RETURNS TRIGGER AS $$
DECLARE field_name TEXT; related UUID; parent_sex TEXT;
BEGIN
  FOREACH field_name IN ARRAY TG_ARGV LOOP
    related := NULLIF(to_jsonb(NEW)->>field_name, '')::uuid;
    IF related IS NOT NULL THEN
      SELECT sex INTO parent_sex FROM goats WHERE id = related AND organization_id = NEW.organization_id AND deleted_at IS NULL;
      IF NOT FOUND THEN RAISE EXCEPTION 'Related animal must belong to this organization' USING ERRCODE = '23514'; END IF;
      IF TG_TABLE_NAME = 'goats' AND related = NEW.id THEN RAISE EXCEPTION 'An animal cannot be its own parent' USING ERRCODE = '23514'; END IF;
      IF field_name = 'dam_id' AND parent_sex <> 'female' THEN RAISE EXCEPTION 'Dam must be female' USING ERRCODE = '23514'; END IF;
      IF field_name = 'sire_id' AND parent_sex <> 'male' THEN RAISE EXCEPTION 'Sire must be male' USING ERRCODE = '23514'; END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS tenant_animal_reference ON goats;
CREATE TRIGGER tenant_animal_reference BEFORE INSERT OR UPDATE ON goats FOR EACH ROW EXECUTE FUNCTION enforce_goat_organization('dam_id', 'sire_id');
DROP TRIGGER IF EXISTS tenant_animal_reference ON breeding_records;
CREATE TRIGGER tenant_animal_reference BEFORE INSERT OR UPDATE ON breeding_records FOR EACH ROW EXECUTE FUNCTION enforce_goat_organization('dam_id', 'sire_id');
DROP TRIGGER IF EXISTS tenant_animal_reference ON health_records;
CREATE TRIGGER tenant_animal_reference BEFORE INSERT OR UPDATE ON health_records FOR EACH ROW EXECUTE FUNCTION enforce_goat_organization('goat_id');
DROP TRIGGER IF EXISTS tenant_animal_reference ON milk_records;
CREATE TRIGGER tenant_animal_reference BEFORE INSERT OR UPDATE ON milk_records FOR EACH ROW EXECUTE FUNCTION enforce_goat_organization('goat_id');
DROP TRIGGER IF EXISTS tenant_animal_reference ON weight_records;
CREATE TRIGGER tenant_animal_reference BEFORE INSERT OR UPDATE ON weight_records FOR EACH ROW EXECUTE FUNCTION enforce_goat_organization('goat_id');
DROP TRIGGER IF EXISTS tenant_animal_reference ON goat_embeddings;
CREATE TRIGGER tenant_animal_reference BEFORE INSERT OR UPDATE ON goat_embeddings FOR EACH ROW EXECUTE FUNCTION enforce_goat_organization('goat_id');
DROP TRIGGER IF EXISTS tenant_animal_reference ON scan_history;
CREATE TRIGGER tenant_animal_reference BEFORE INSERT OR UPDATE ON scan_history FOR EACH ROW EXECUTE FUNCTION enforce_goat_organization('goat_id');

CREATE OR REPLACE FUNCTION enforce_scan_limit() RETURNS TRIGGER AS $$
DECLARE maximum INTEGER; enabled BOOLEAN;
BEGIN
  IF current_app_role() IN ('admin', 'super_admin', 'service') THEN RETURN NEW; END IF;
  PERFORM id FROM organizations WHERE id = NEW.organization_id FOR UPDATE;
  SELECT t.max_scans_per_day, t.smart_scan_enabled INTO maximum, enabled FROM organizations o JOIN tiers t ON t.id = o.tier WHERE o.id = NEW.organization_id;
  IF maximum IS NULL OR NOT enabled OR (maximum >= 0 AND (SELECT count(*) FROM scan_history WHERE organization_id = NEW.organization_id AND created_at >= date_trunc('day', NOW())) >= maximum)
  THEN RAISE EXCEPTION 'Daily scan limit reached or smart scan unavailable' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS scans_plan_limit ON scan_history;
CREATE TRIGGER scans_plan_limit BEFORE INSERT ON scan_history FOR EACH ROW EXECUTE FUNCTION enforce_scan_limit();
