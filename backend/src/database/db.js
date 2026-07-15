const client = (process.env.DB_CLIENT || 'sqlite').toLowerCase();

if (client === 'postgres' || client === 'postgresql') {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required when DB_CLIENT=postgres');
  }
  module.exports = require('./postgresDb');
} else {
  module.exports = require('./sqliteDb');
}
