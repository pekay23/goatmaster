const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    const data = JSON.parse(event.body);
    await client.connect();

    const query = `
      INSERT INTO health_logs (goat_id, event_date, treatment, notes, next_due_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    // Handle empty dates by converting '' to null
    const nextDue = data.next_due_date === '' ? null : data.next_due_date;

    const values = [data.goat_id, data.event_date, data.treatment, data.notes, nextDue];
    
    const result = await client.query(query, values);
    await client.end();

    return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
