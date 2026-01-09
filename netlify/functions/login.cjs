const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    const { username, password } = JSON.parse(event.body);
    await client.connect();

    // Check if user exists with that password
    const result = await client.query(
      'SELECT username FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    
    await client.end();

    if (result.rows.length > 0) {
      // Success! Return the username
      return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
    } else {
      // Failed
      return { statusCode: 401, body: JSON.stringify({ error: "Wrong credentials" }) };
    }
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};
