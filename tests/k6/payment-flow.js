import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 10 },
    { duration: '30s', target: 30 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.99'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:5000';

export function setup() {
  const response = http.post(`${baseUrl}/api/auth/login`, JSON.stringify({
    email: 'admin@fitlife.vn',
    password: 'admin123',
  }), { headers: { 'Content-Type': 'application/json' } });
  check(response, { 'setup login succeeds': (r) => r.status === 200 });
  return { token: response.json('data.token') };
}

export default function (data) {
  const headers = { Authorization: `Bearer ${data.token}` };
  const responses = http.batch([
    ['GET', `${baseUrl}/api/health`],
    ['GET', `${baseUrl}/api/plans`, null, { headers }],
    ['GET', `${baseUrl}/api/payments?page=1&limit=10`, null, { headers }],
    ['GET', `${baseUrl}/api/reports/dashboard`, null, { headers }],
  ]);

  check(responses[0], { 'health is 200': (r) => r.status === 200 });
  check(responses[1], { 'plans is 200': (r) => r.status === 200 });
  check(responses[2], { 'payments is 200': (r) => r.status === 200 });
  check(responses[3], { 'dashboard is 200': (r) => r.status === 200 });
  sleep(1);
}
