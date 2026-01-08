const { Client } = require('pg');

exports.handler = async (event, context) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    
    // Fetch Past Due (< Today) and Upcoming (Today + 7 days)
    const query = `
      SELECT h.id, g.name, g.goat_id_alias, h.procedure_type, h.next_due_date,
      CASE 
        WHEN h.next_due_date < CURRENT_DATE THEN 'red'
        WHEN h.next_due_date <= CURRENT_DATE + 7 THEN 'orange'
        ELSE 'green'
      END as alert_level
      FROM health_logs h
      JOIN goats g ON h.goat_id = g.id
      WHERE h.next_due_date <= CURRENT_DATE + 7
      AND h.next_due_date IS NOT NULL
      ORDER BY h.next_due_date ASC
    `;

    const result = await client.query(query);
    
    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  } finally {
    await client.end();
  }
};
