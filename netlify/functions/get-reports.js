const { Client } = require('pg');

exports.handler = async (event) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { type } = event.queryStringParameters; // e.g., 'health', 'breeding', 'herd'
  let query = '';

  if (type === 'health') {
    // Logic: Fetch logs where next_due_date is in the past
    query = `SELECT g.name, h.procedure_type, h.next_due_date, h.notes 
             FROM health_logs h JOIN goats g ON h.goat_id = g.id 
             WHERE h.next_due_date < CURRENT_DATE`;
  } else if (type === 'breeding') {
    // Logic: Fetch does with expected kidding dates
    query = `SELECT g.name as doe, b.date_bred, b.estimated_kidding_date 
             FROM breeding_logs b JOIN goats g ON b.dam_id = g.id 
             WHERE b.actual_kidding_date IS NULL`;
  } else if (type === 'herd') {
    // Logic: Summary counts
    query = `SELECT breed, sex, COUNT(*) as count FROM goats GROUP BY breed, sex`;
  }

  const result = await client.query(query);
  await client.end();

  return { statusCode: 200, body: JSON.stringify(result.rows) };
};
