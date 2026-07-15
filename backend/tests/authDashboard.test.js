const request = require('supertest');
const app = require('../src/app');

let adminToken;
let memberToken;

describe('Auth and Dashboard API', () => {
  test('Admin can login successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@fitlife.vn',
        password: 'admin123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('admin');

    adminToken = res.body.data.token;
  });

  test('Member can login successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ha.member@fitlife.vn',
        password: 'member123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('member');

    memberToken = res.body.data.token;
  });

  test('Login fails with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@fitlife.vn',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Authenticated user can get profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('admin@fitlife.vn');
  });

  test('Dashboard requires authentication', async () => {
    const res = await request(app)
      .get('/api/reports/dashboard');

    expect(res.statusCode).toBe(401);
  });

  test('Member cannot access admin dashboard', async () => {
    const res = await request(app)
      .get('/api/reports/dashboard')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('Admin can access dashboard', async () => {
    const res = await request(app)
      .get('/api/reports/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overview.total_members).toBeGreaterThanOrEqual(1);
    expect(res.body.data.finance.total_revenue).toBeGreaterThanOrEqual(0);
  });
});