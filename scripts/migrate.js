import { query } from '../lib/db.js';

async function migrate() {
  console.log('Running migrations...');
  
  await query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS goats (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      owner_id VARCHAR(255) DEFAULT 'demo',
      name VARCHAR(255) NOT NULL,
      breed VARCHAR(100),
      sex VARCHAR(10),
      dob TIMESTAMP,
      image_url TEXT,
      ear_tag VARCHAR(100),
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
  `);

  console.log('Migrations complete.');
  process.exit(0);
}

migrate().catch(console.error);
