-- RLS Policies for Multi-Tenant Data Isolation
-- Run this after migrate.js

-- Create function to get current org ID from session
CREATE OR REPLACE FUNCTION current_org_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_org_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- Create function to set org context
CREATE OR REPLACE FUNCTION set_org_context(p_org_id UUID, p_user_id UUID) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_org_id', p_org_id::text, true);
  PERFORM set_config('app.current_user_id', p_user_id::text, true);
END;
$$ LANGUAGE plpgsql;

-- Enable RLS and FORCE RLS on all tenant tables
ALTER TABLE goats ENABLE ROW LEVEL SECURITY;
ALTER TABLE goats FORCE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory FORCE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales FORCE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records FORCE ROW LEVEL SECURITY;
ALTER TABLE breeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_records FORCE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts FORCE ROW LEVEL SECURITY;
ALTER TABLE corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrections FORCE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenditures FORCE ROW LEVEL SECURITY;
ALTER TABLE milk_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_records FORCE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records FORCE ROW LEVEL SECURITY;
ALTER TABLE farm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_events FORCE ROW LEVEL SECURITY;
ALTER TABLE farm_event_goats ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_event_goats FORCE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members FORCE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE impersonation_sessions FORCE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
  END LOOP;
END $$;

-- Create RLS policies with USING and WITH CHECK for each table
CREATE POLICY goats_org_isolation ON goats
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY inventory_org_isolation ON inventory
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY sales_org_isolation ON sales
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY health_records_org_isolation ON health_records
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY breeding_records_org_isolation ON breeding_records
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY alerts_org_isolation ON alerts
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY corrections_org_isolation ON corrections
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY usage_logs_org_isolation ON usage_logs
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY expenditures_org_isolation ON expenditures
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY milk_records_org_isolation ON milk_records
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY weight_records_org_isolation ON weight_records
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY farm_events_org_isolation ON farm_events
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY farm_event_goats_org_isolation ON farm_event_goats
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY users_org_isolation ON users
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY org_members_org_isolation ON organization_members
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY organizations_org_isolation ON organizations
  FOR ALL USING (id = current_org_id())
  WITH CHECK (id = current_org_id());

CREATE POLICY push_subscriptions_org_isolation ON push_subscriptions
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE organization_id = current_org_id()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE organization_id = current_org_id()));

CREATE POLICY audit_logs_org_isolation ON audit_logs
  FOR ALL USING (organization_id = current_org_id() OR organization_id IS NULL)
  WITH CHECK (organization_id = current_org_id() OR organization_id IS NULL);

CREATE POLICY impersonation_sessions_org_isolation ON impersonation_sessions
  FOR ALL USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());