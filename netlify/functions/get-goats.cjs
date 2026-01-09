const { Client } = require('pg');

exports.handler = async (event, context) => {
  // 1. Connect to the database
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    
    // 2. Run the SQL query
    const result = await client.query('SELECT * FROM goats ORDER BY created_at DESC');
    
    // 3. Close connection
    await client.end();

    // 4. Return the data as JSON
    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
    };
  } catch (error) {
    console.error('Database Error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.toString() }) 
    };
  }
};
