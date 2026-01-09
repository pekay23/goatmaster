const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    const data = JSON.parse(event.body);
    
    // CALCULATE DUE DATE (Date Bred + 150 Days)
    const breedDate = new Date(data.date_bred);
    const dueDateObj = new Date(breedDate.setDate(breedDate.getDate() + 150));
    const estimatedKiddingDate = dueDateObj.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    await client.connect();

    const query = `
      INSERT INTO breeding_logs (dam_id, sire_id, date_bred, estimated_kidding_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    // Use null if sire_id is empty
    const sireId = data.sire_id === '' ? null : data.sire_id;

    const values = [data.dam_id, sireId, data.date_bred, estimatedKiddingDate];
    
    const result = await client.query(query, values);
    await client.end();

    return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
