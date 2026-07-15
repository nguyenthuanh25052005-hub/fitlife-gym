const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (error) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    service: 'fitlife-core-api',
    event: 'postgres_pool_error',
    message: error.message
  }));
});

function normalizeSql(input) {
  let sql = String(input).trim();
  if (/^PRAGMA\b/i.test(sql)) {return null;}

  // Translate the small SQLite date/function subset used by the Level 1 code
  // so the same controllers can run against PostgreSQL in Level 2.
  sql = sql
    .replace(/DATETIME\('now'\s*,\s*'localtime'\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/DATE\('now'\s*,\s*'localtime'\s*,\s*'\+(\d+) days'\)/gi,
      (_, days) => `(CURRENT_DATE + INTERVAL '${days} days')::date`)
    .replace(/DATE\('now'\s*,\s*'localtime'\)/gi, 'CURRENT_DATE')
    .replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/DATETIME\(([^()]+)\)/gi, '(($1)::timestamp)')
    .replace(/strftime\('%Y-%m',\s*checkin_time\)\s*=\s*strftime\('%Y-%m',\s*'now'\)/gi,
      "TO_CHAR(checkin_time, 'YYYY-MM') = TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM')")
    .replace(/JULIANDAY\(([^()]+)\)\s*-\s*JULIANDAY\(([^()]+)\)/gi,
      '(($1)::date - ($2)::date)')
    .replace(/\bINTEGER PRIMARY KEY AUTOINCREMENT\b/gi, 'SERIAL PRIMARY KEY')
    .replace(/\bDATETIME\b/gi, 'TIMESTAMP')
    .replace(/\sLIKE\s/gi, ' ILIKE ');

  let index = 0;
  sql = sql.replace(/\?/g, () => `$${++index}`);
  return sql;
}

function callbackOrThrow(callback, error) {
  if (typeof callback === 'function') {return callback(error);}
  if (error) {console.error('PostgreSQL query failed:', error.message);}
  return undefined;
}

const db = {
  serialize(fn) {
    fn();
  },

  run(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    let normalized = normalizeSql(sql);
    if (!normalized) {
      if (typeof callback === 'function') {callback.call({ lastID: undefined, changes: 0 }, null);}
      return this;
    }

    if (/^INSERT\b/i.test(normalized) && !/\bRETURNING\b/i.test(normalized)) {
      normalized = `${normalized.replace(/;$/, '')} RETURNING id`;
    }

    pool.query(normalized, params)
      .then((result) => {
        const rows = result.rows || [];
        const lastID = rows.length ? rows[rows.length - 1].id : undefined;
        if (typeof callback === 'function') {
          callback.call({ lastID, changes: result.rowCount || 0 }, null);
        }
      })
      .catch((error) => callbackOrThrow(callback, error));
    return this;
  },

  get(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const normalized = normalizeSql(sql);
    if (!normalized) {return callback?.(null, undefined);}
    pool.query(normalized, params)
      .then((result) => callback?.(null, result.rows[0]))
      .catch((error) => callbackOrThrow(callback, error));
    return this;
  },

  all(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const normalized = normalizeSql(sql);
    if (!normalized) {return callback?.(null, []);}
    pool.query(normalized, params)
      .then((result) => callback?.(null, result.rows))
      .catch((error) => callbackOrThrow(callback, error));
    return this;
  },

  close(callback) {
    pool.end().then(() => callback?.(null)).catch((error) => callback?.(error));
  },

  pool
};

if (process.env.NODE_ENV !== 'test') {
  pool.query('SELECT 1')
    .then(() => console.log('Connected to FitLife PostgreSQL database'))
    .catch((error) => console.error('PostgreSQL connection failed:', error.message));
}

module.exports = db;
module.exports.normalizeSql = normalizeSql;
