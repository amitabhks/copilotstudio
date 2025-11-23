const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// helper
const runQuery = async (queryText, params = []) => {
  const client = await pool.connect();
  try {
    const res = await client.query(queryText, params);
    return res;
  } finally {
    client.release();
  }
};
module.exports = runQuery;
