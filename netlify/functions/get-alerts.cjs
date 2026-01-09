const { Client } = require('pg');

exports.handler = async (event, context) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();

    // Query: Find logs where the 'Next Due Date' is either in the past OR in the next 7 days
    const query = `
      SELECT h.id, g.name, h.treatment, h.next_due_date
      FROM health_logs h
      JOIN goats g ON h.goat_id = g.id
      WHERE h.next_due_date IS NOT NULL
      AND h.next_due_date <= (CURRENT_DATE + INTERVAL '7 days')
      ORDER BY h.next_due_date ASC
    `;

    const result = await client.query(query);
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
    };
  } catch (error) {
    console.error("Alerts Error:", error);
    return { statusCode: 500, body: error.message };
  }
};
