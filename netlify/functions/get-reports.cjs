const { Client } = require('pg');

exports.handler = async (event) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { type } = event.queryStringParameters; // 'health', 'breeding', or 'herd'
  let query = '';

  try {
    if (type === 'health') {
      // For now, just show all goats as a test (since we don't have health logs yet)
      query = `SELECT name, sex, breed, dob FROM goats`; 
    } else if (type === 'breeding') {
      // Placeholder for breeding logic
      query = `SELECT name, sex, breed FROM goats WHERE sex = 'F'`;
    } else {
      // 'herd' - Summary counts
      query = `SELECT breed, sex, COUNT(*) as count FROM goats GROUP BY breed, sex`;
    }

    const result = await client.query(query);
    await client.end();

    return { statusCode: 200, body: JSON.stringify(result.rows) };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};
