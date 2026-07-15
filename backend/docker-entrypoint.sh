#!/bin/sh
set -eu

if [ "${DB_CLIENT:-sqlite}" = "postgres" ] || [ "${DB_CLIENT:-sqlite}" = "postgresql" ]; then
  echo "Waiting for PostgreSQL..."
  node - <<'NODE'
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let attempts = 30;
(async () => {
  while (attempts > 0) {
    try {
      await pool.query('SELECT 1');
      await pool.end();
      process.exit(0);
    } catch (error) {
      attempts -= 1;
      if (!attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
NODE
  npm run init-db:postgres
  if [ "${SEED_ON_START:-false}" = "true" ]; then
    npm run seed:postgres
  fi
fi

exec "$@"
