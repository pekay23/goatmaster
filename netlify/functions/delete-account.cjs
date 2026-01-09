const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'DELETE') return { statusCode: 405, body: 'Method Not Allowed' };

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    const { username } = JSON.parse(event.body);
    await client.connect();

    // Delete the user
    await client.query('DELETE FROM users WHERE username = $1', [username]);
    
    await client.end();

    return { statusCode: 200, body: JSON.stringify({ message: "Account deleted" }) };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};
