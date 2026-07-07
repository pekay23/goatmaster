import { query } from './lib/db.js';

async function run() {
  const res = await query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'goats';
  `);
  console.log(res.rows);
  process.exit(0);
}
run();
