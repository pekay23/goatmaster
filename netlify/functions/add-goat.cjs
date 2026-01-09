const { Client } = require('pg');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    const data = JSON.parse(event.body);
    await client.connect();

    // Convert empty strings to null to avoid database errors
    const dob = data.dob === '' ? null : data.dob;
    const breed = data.breed === '' ? null : data.breed;
    const sex = data.sex || 'F';

    const query = `
      INSERT INTO goats (name, sex, breed, dob, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [data.name, sex, breed, dob, data.image_url];
    
    const result = await client.query(query, values);
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows[0]),
    };
  } catch (error) {
    console.error("Database Error:", error);
    return { statusCode: 500, body: `Database Error: ${error.message}` };
  }
};
