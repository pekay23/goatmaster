const { Client } = require('pg');

exports.handler = async (event) => {
  // We use PUT for updates
  if (event.httpMethod !== 'PUT') return { statusCode: 405, body: 'Method Not Allowed' };

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    const data = JSON.parse(event.body);
    
    // We MUST have an ID to know which goat to update
    if (!data.id) return { statusCode: 400, body: "Missing Goat ID" };

    await client.connect();

    const query = `
      UPDATE goats 
      SET name = $1, breed = $2, sex = $3, dob = $4, image_url = $5
      WHERE id = $6
      RETURNING *
    `;
    
    // Handle empty date string
    const dob = data.dob === '' ? null : data.dob;

    const values = [data.name, data.breed, data.sex, dob, data.image_url, data.id];
    
    const result = await client.query(query, values);
    await client.end();

    return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};
