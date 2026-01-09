const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    const { username, password } = JSON.parse(event.body);
    
    if (!username || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: "Username and Password required" }) };
    }

    await client.connect();

    // 1. Check if username exists
    const check = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    if (check.rows.length > 0) {
      await client.end();
      return { statusCode: 409, body: JSON.stringify({ error: "Username already taken" }) };
    }

    // 2. Insert new user
    await client.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, password]);
    
    await client.end();

    return { statusCode: 200, body: JSON.stringify({ message: "User created successfully" }) };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};
