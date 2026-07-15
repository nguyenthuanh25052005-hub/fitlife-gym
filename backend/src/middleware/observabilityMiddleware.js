const { randomUUID } = require('crypto');

const counters = { requests: 0, errors: 0, totalDurationMs: 0 };

function observabilityMiddleware(req, res, next) {
  const started = process.hrtime.bigint();
  const requestId = req.get('x-request-id') || randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  counters.requests += 1;

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    counters.totalDurationMs += durationMs;
    if (res.statusCode >= 500) {
      counters.errors += 1;
    }
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    if (process.env.NODE_ENV !== 'test' || process.env.LOG_TEST_REQUESTS === 'true') {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        service: 'fitlife-core-api',
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2))
      }));
    }
  });
  next();
}

function metricsHandler(req, res) {
  const average = counters.requests ? counters.totalDurationMs / counters.requests : 0;
  res.type('text/plain').send([
    '# HELP fitlife_http_requests_total Total HTTP requests',
    '# TYPE fitlife_http_requests_total counter',
    `fitlife_http_requests_total ${counters.requests}`,
    '# HELP fitlife_http_errors_total Total HTTP 5xx responses',
    '# TYPE fitlife_http_errors_total counter',
    `fitlife_http_errors_total ${counters.errors}`,
    '# HELP fitlife_http_request_duration_ms_avg Average response time in milliseconds',
    '# TYPE fitlife_http_request_duration_ms_avg gauge',
    `fitlife_http_request_duration_ms_avg ${average.toFixed(2)}`
  ].join('\n'));
}

module.exports = { observabilityMiddleware, metricsHandler };
