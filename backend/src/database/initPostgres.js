const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

async function main() {
  if (!process.env.DATABASE_URL) {throw new Error('DATABASE_URL is required');}
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'postgres/schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('FitLife PostgreSQL schema created successfully');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('PostgreSQL initialization failed:', error.message);
  process.exitCode = 1;
});
