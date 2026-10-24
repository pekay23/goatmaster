import { query } from '../lib/db.js';

async function migrate() {
  console.log('Running migrations...');
  
  await query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "vector";

    CREATE TABLE IF NOT EXISTS goats (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      owner_id VARCHAR(255) DEFAULT 'demo',
      name VARCHAR(255) NOT NULL,
      breed VARCHAR(100),
      sex VARCHAR(10),
      dob TIMESTAMP,
      image_url TEXT,
      ear_tag VARCHAR(100),
      dam_id UUID REFERENCES goats(id) ON DELETE SET NULL,
      sire_id UUID REFERENCES goats(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      owner_id VARCHAR(255) DEFAULT 'demo',
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      quantity NUMERIC(10, 2) DEFAULT 0,
      unit VARCHAR(50),
      low_stock_threshold NUMERIC(10, 2) DEFAULT 0,
      unit_price NUMERIC(10, 2) DEFAULT 0,
      supplier VARCHAR(255),
      sync_status VARCHAR(50) DEFAULT 'synced',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      owner_id VARCHAR(255) DEFAULT 'demo',
      customer VARCHAR(255) NOT NULL,
      amount NUMERIC(10, 2) DEFAULT 0,
      contact_info TEXT,
      items_data JSONB DEFAULT '[]'::jsonb,
      sync_status VARCHAR(50) DEFAULT 'synced',
      sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      username VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      tier VARCHAR(50) DEFAULT 'free',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS health_records (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      goat_id UUID REFERENCES goats(id) ON DELETE CASCADE,
      owner_id VARCHAR(255) DEFAULT 'demo',
      type VARCHAR(100),
      notes TEXT,
      treatment TEXT,
      cost NUMERIC(10, 2) DEFAULT 0,
      record_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      next_due_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS breeding_records (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      dam_id UUID REFERENCES goats(id) ON DELETE CASCADE,
      sire_id UUID REFERENCES goats(id) ON DELETE SET NULL,
      owner_id VARCHAR(255) DEFAULT 'demo',
      mating_date TIMESTAMP,
      expected_kidding_date TIMESTAMP,
      actual_kidding_date TIMESTAMP,
      kids_count INTEGER DEFAULT 0,
      notes TEXT,
      status VARCHAR(50) DEFAULT 'planned',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      owner_id VARCHAR(255) DEFAULT 'demo',
      type VARCHAR(50),
      title VARCHAR(255),
      message TEXT,
      is_read BOOLEAN DEFAULT false,
      related_entity_id VARCHAR(255),
      related_entity_type VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS corrections (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      owner_id VARCHAR(255) DEFAULT 'demo',
      correction_type VARCHAR(50),
      source_goat_id UUID,
      target_goat_id UUID,
      notes TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      owner_id VARCHAR(255) DEFAULT 'demo',
      inventory_item_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
      item_name VARCHAR(255) NOT NULL,
      quantity_used NUMERIC(10, 2) NOT NULL,
      unit VARCHAR(50),
      notes TEXT,
      logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenditures (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      owner_id VARCHAR(255) DEFAULT 'demo',
      amount NUMERIC(10, 2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT,
      inventory_item_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
      spent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS milk_records (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      goat_id UUID REFERENCES goats(id) ON DELETE CASCADE,
      owner_id VARCHAR(255) DEFAULT 'demo',
      record_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      morning_yield NUMERIC(10, 2) DEFAULT 0,
      evening_yield NUMERIC(10, 2) DEFAULT 0,
      somatic_cell_count INTEGER,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weight_records (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      goat_id UUID REFERENCES goats(id) ON DELETE CASCADE,
      owner_id VARCHAR(255) DEFAULT 'demo',
      record_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      weight_kg NUMERIC(10, 2) NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS farm_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      owner_id VARCHAR(255) DEFAULT 'demo',
      subject TEXT NOT NULL,
      details TEXT DEFAULT '',
      event_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      category VARCHAR(100) DEFAULT 'General',
      keywords JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS farm_event_goats (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      event_id UUID REFERENCES farm_events(id) ON DELETE CASCADE,
      goat_id UUID REFERENCES goats(id) ON DELETE CASCADE,
      owner_id VARCHAR(255) DEFAULT 'demo',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, goat_id)
    );

    CREATE INDEX IF NOT EXISTS idx_farm_events_owner ON farm_events(owner_id);
    CREATE INDEX IF NOT EXISTS idx_farm_events_date ON farm_events(event_date);
    CREATE INDEX IF NOT EXISTS idx_farm_events_keywords ON farm_events USING GIN(keywords);
    CREATE INDEX IF NOT EXISTS idx_farm_event_goats_event ON farm_event_goats(event_id);
    CREATE INDEX IF NOT EXISTS idx_farm_event_goats_goat ON farm_event_goats(goat_id);

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh_key TEXT NOT NULL,
      auth_key TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

    CREATE TABLE IF NOT EXISTS tiers (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      price_cents INTEGER DEFAULT 0,
      max_goats INTEGER DEFAULT -1,
      max_scans_per_day INTEGER DEFAULT -1,
      ai_training_enabled BOOLEAN DEFAULT false,
      smart_scan_enabled BOOLEAN DEFAULT false,
      paystack_plan_code_monthly VARCHAR(100),
      paystack_plan_code_annual VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default tiers if table is empty
  const { rows: tierCount } = await query('SELECT COUNT(*) as count FROM tiers');
  if (parseInt(tierCount[0].count) === 0) {
    await query(`
      INSERT INTO tiers (id, name, price_cents, max_goats, max_scans_per_day, ai_training_enabled, smart_scan_enabled, paystack_plan_code_monthly, paystack_plan_code_annual) VALUES
        ('free', 'Free', 0, 5, 10, false, false, NULL, NULL),
        ('basic', 'Basic', 9900, 25, 100, true, false, 'PLN_basic_monthly', 'PLN_basic_annual'),
        ('pro', 'Pro', 29900, -1, -1, true, true, 'PLN_pro_monthly', 'PLN_pro_annual'),
        ('enterprise', 'Enterprise', 99900, -1, -1, true, true, 'PLN_enterprise_monthly', 'PLN_enterprise_annual')
    `);
    console.log('Default tiers seeded.');
  }

  // Billing tables
  await query(`
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      reference VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) NOT NULL,
      amount INTEGER NOT NULL,
      status VARCHAR(50) NOT NULL,
      tier VARCHAR(50),
      organization_id UUID REFERENCES organizations(id),
      paystack_data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      plan_code VARCHAR(100) NOT NULL,
      subscription_code VARCHAR(100) UNIQUE NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      current_period_end TIMESTAMP,
      cancel_at_period_end BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS billing_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      event_id VARCHAR(255) UNIQUE NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      organization_id UUID REFERENCES organizations(id),
      payload JSONB NOT NULL,
      processed_at TIMESTAMP,
      status VARCHAR(50) DEFAULT 'pending',
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscription_history (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      from_tier VARCHAR(50),
      to_tier VARCHAR(50),
      change_type VARCHAR(50),
      changed_by VARCHAR(100),
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);
    CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_code ON subscriptions(subscription_code);
    CREATE INDEX IF NOT EXISTS idx_billing_events_type ON billing_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_billing_events_org ON billing_events(organization_id);
    CREATE INDEX IF NOT EXISTS idx_billing_events_event_id ON billing_events(event_id);
    CREATE INDEX IF NOT EXISTS idx_subscription_history_org ON subscription_history(organization_id);
  `);

  await query(`
    ALTER TABLE health_records ADD COLUMN IF NOT EXISTS next_due_date TIMESTAMP;
    ALTER TABLE goats ADD COLUMN IF NOT EXISTS dam_id UUID REFERENCES goats(id) ON DELETE SET NULL;
    ALTER TABLE goats ADD COLUMN IF NOT EXISTS sire_id UUID REFERENCES goats(id) ON DELETE SET NULL;
    -- Add organization_id columns to existing tables
    ALTER TABLE goats ADD COLUMN IF NOT EXISTS organization_id UUID;
    ALTER TABLE inventory ADD COLUMN IF NOT EXISTS organization_id UUID;
    ALTER TABLE sales ADD COLUMN IF NOT EXISTS organization_id UUID;
    ALTER TABLE health_records ADD COLUMN IF NOT EXISTS organization_id UUID;
    ALTER TABLE breeding_records ADD COLUMN IF NOT EXISTS organization_id UUID;
    ALTER TABLE alerts ADD COLUMN IF NOT EXISTS organization_id UUID;
    ALTER TABLE corrections ADD COLUMN IF NOT EXISTS organization_id UUID;
    ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS organization_id UUID;
    ALTER TABLE expenditures ADD COLUMN IF NOT EXISTS organization_id UUID;
    ALTER TABLE milk_records ADD COLUMN IF NOT EXISTS organization_id UUID;
    ALTER TABLE weight_records ADD COLUMN IF NOT EXISTS organization_id UUID;
    ALTER TABLE farm_events ADD COLUMN IF NOT EXISTS organization_id UUID;
    ALTER TABLE farm_event_goats ADD COLUMN IF NOT EXISTS organization_id UUID;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID;
  `);

  // Create organizations and organization_members tables
  await query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      tier VARCHAR(50) DEFAULT 'free',
      paystack_customer_code VARCHAR(100),
      paystack_subscription_code VARCHAR(100),
      subscription_status VARCHAR(50) DEFAULT 'inactive',
      current_period_end TIMESTAMP,
      cancel_at_period_end BOOLEAN DEFAULT false,
      manual_override BOOLEAN DEFAULT false,
      override_reason TEXT,
      custom_domain VARCHAR(255),
      custom_domain_verified BOOLEAN DEFAULT false,
      settings JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS organization_members (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'member',
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(organization_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
    CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_goats_org ON goats(organization_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_org ON inventory(organization_id);
    CREATE INDEX IF NOT EXISTS idx_sales_org ON sales(organization_id);
    CREATE INDEX IF NOT EXISTS idx_health_records_org ON health_records(organization_id);
    CREATE INDEX IF NOT EXISTS idx_breeding_records_org ON breeding_records(organization_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_org ON alerts(organization_id);
    CREATE INDEX IF NOT EXISTS idx_corrections_org ON corrections(organization_id);
    CREATE INDEX IF NOT EXISTS idx_usage_logs_org ON usage_logs(organization_id);
    CREATE INDEX IF NOT EXISTS idx_expenditures_org ON expenditures(organization_id);
    CREATE INDEX IF NOT EXISTS idx_milk_records_org ON milk_records(organization_id);
    CREATE INDEX IF NOT EXISTS idx_weight_records_org ON weight_records(organization_id);
    CREATE INDEX IF NOT EXISTS idx_farm_events_org ON farm_events(organization_id);
    CREATE INDEX IF NOT EXISTS idx_farm_event_goats_org ON farm_event_goats(organization_id);
    CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
  `);

  // Create default organizations for existing users
  await query(`
    INSERT INTO organizations (id, name, slug, tier)
    SELECT 
      uuid_generate_v4(),
      COALESCE(username, email),
      LOWER(REPLACE(COALESCE(username, split_part(email, '@', 1)), ' ', '-')),
      COALESCE(tier, 'free')
    FROM users
    WHERE organization_id IS NULL
    ON CONFLICT (slug) DO NOTHING;
  `);

  await query(`
    UPDATE users u
    SET organization_id = o.id
    FROM organizations o
    WHERE o.slug = LOWER(REPLACE(COALESCE(u.username, split_part(u.email, '@', 1)), ' ', '-'))
      AND u.organization_id IS NULL;
  `);

  // Create organization_members for existing users
  await query(`
    INSERT INTO organization_members (organization_id, user_id, role, status)
    SELECT u.organization_id, u.id, 
      CASE WHEN u.role = 'admin' THEN 'admin' ELSE 'owner' END,
      'active'
    FROM users u
    WHERE u.organization_id IS NOT NULL
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  `);

  await query(`
    ALTER TABLE health_records ADD COLUMN IF NOT EXISTS next_due_date TIMESTAMP;
    ALTER TABLE goats ADD COLUMN IF NOT EXISTS dam_id UUID REFERENCES goats(id) ON DELETE SET NULL;
    ALTER TABLE goats ADD COLUMN IF NOT EXISTS sire_id UUID REFERENCES goats(id) ON DELETE SET NULL;
    ALTER TABLE farm_events ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE farm_events ADD COLUMN IF NOT EXISTS inventory_item_id UUID REFERENCES inventory(id) ON DELETE SET NULL;
    ALTER TABLE farm_events ADD COLUMN IF NOT EXISTS quantity_used NUMERIC(10, 2);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      actor_id UUID,
      actor_email VARCHAR(255),
      actor_role VARCHAR(50),
      action VARCHAR(100) NOT NULL,
      resource VARCHAR(100),
      resource_id VARCHAR(255),
      organization_id UUID,
      before_state JSONB DEFAULT '{}'::jsonb,
      after_state JSONB DEFAULT '{}'::jsonb,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS impersonation_sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      revoked_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS retention_offers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      offer_type VARCHAR(50) NOT NULL,
      discount INTEGER DEFAULT 0,
      expires_at TIMESTAMP NOT NULL,
      status VARCHAR(50) DEFAULT 'sent',
      notes TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      entity VARCHAR(100) NOT NULL,
      entity_id UUID NOT NULL,
      operation VARCHAR(20) NOT NULL,
      data JSONB NOT NULL,
      vector_clock JSONB DEFAULT '{}'::jsonb,
      status VARCHAR(20) DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      last_error TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS goat_embeddings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      goat_id UUID NOT NULL REFERENCES goats(id) ON DELETE CASCADE,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      embedding vector(128) NOT NULL,
      image_url TEXT,
      model_version VARCHAR(50) DEFAULT 'resnet50-triplet',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scan_history (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      goat_id UUID REFERENCES goats(id) ON DELETE SET NULL,
      goat_name VARCHAR(255),
      confidence NUMERIC(5,4),
      detected BOOLEAN DEFAULT false,
      method VARCHAR(50),
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_admin ON impersonation_sessions(admin_id);
    CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_org ON impersonation_sessions(organization_id);
    CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_token ON impersonation_sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_retention_offers_org ON retention_offers(organization_id);
    CREATE INDEX IF NOT EXISTS idx_retention_offers_status ON retention_offers(status);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_org ON sync_queue(organization_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_goat_embeddings_goat ON goat_embeddings(goat_id);
    CREATE INDEX IF NOT EXISTS idx_goat_embeddings_org ON goat_embeddings(organization_id);
    CREATE INDEX IF NOT EXISTS idx_scan_history_org ON scan_history(organization_id);
    CREATE INDEX IF NOT EXISTS idx_scan_history_goat ON scan_history(goat_id);
    CREATE INDEX IF NOT EXISTS idx_scan_history_created ON scan_history(created_at);
  `);

  console.log('Migrations complete.');
  process.exit(0);
}

migrate().catch(console.error);
