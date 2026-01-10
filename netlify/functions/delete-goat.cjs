const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'DELETE') return { statusCode: 405, body: 'Method Not Allowed' };

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    const { id } = JSON.parse(event.body);
    
    if (!id) return { statusCode: 400, body: "Missing Goat ID" };

    await client.connect();

    // 1. Delete related records first (Foreign Key constraints)
    await client.query('DELETE FROM health_logs WHERE goat_id = $1', [id]);
    await client.query('DELETE FROM breeding_logs WHERE dam_id = $1 OR sire_id = $1', [id]);

    // 2. Delete the goat itself
    await client.query('DELETE FROM goats WHERE id = $1', [id]);
    
    await client.end();

    return { statusCode: 200, body: JSON.stringify({ message: "Goat deleted successfully" }) };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};
