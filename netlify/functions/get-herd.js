const { Client } = require('pg');

exports.handler = async (event, context) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    
    // Basic search parameters
    const { search, sex, breed } = event.queryStringParameters || {};
    
    let query = `
      SELECT id, goat_id_alias, name, sex, breed, status, image_url 
      FROM goats 
      WHERE 1=1
    `;
    const params = [];
    let counter = 1;

    if (search) {
      query += ` AND (name ILIKE $${counter} OR goat_id_alias ILIKE $${counter})`;
      params.push(`%${search}%`);
      counter++;
    }
    
    if (sex) {
      query += ` AND sex = $${counter}`;
      params.push(sex);
      counter++;
    }

    query += ` ORDER BY goat_id_alias ASC`;

    const result = await client.query(query, params);
    
    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  } finally {
    await client.end();
  }
};
