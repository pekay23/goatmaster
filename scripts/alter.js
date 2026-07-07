import { query } from '../lib/db.js';

async function alterTables() {
  console.log('Altering tables...');
  
  const tables = ['alerts', 'corrections', 'usage_logs', 'expenditures'];
  for (const table of tables) {
    try {
      await query(`ALTER TABLE ${table} ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log(`Added updated_at to ${table}`);
    } catch (e) {
      if (e.code === '42701') {
        console.log(`updated_at already exists on ${table}`);
      } else {
        console.error(`Error on ${table}:`, e);
      }
    }
  }

  console.log('Done.');
  process.exit(0);
}

alterTables().catch(console.error);
