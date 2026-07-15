const request = require('supertest');
const app = require('../src/app');

let adminToken;
let memberToken;

beforeAll(async () => {
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@fitlife.vn',
      password: 'admin123'
    });

  adminToken = adminLogin.body.data.token;

  const memberLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'ha.member@fitlife.vn',
      password: 'member123'
    });

  memberToken = memberLogin.body.data.token;
});

describe('Coverage Boost - Auth', () => {
  test('Login validates missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@fitlife.vn' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Login fails with non-existing email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'notfound@fitlife.vn',
        password: 'admin123'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Register validates short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Short Password User',
        email: `short.${Date.now()}@fitlife.vn`,
        password: '123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Register validates existing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Existing User',
        email: 'ha.member@fitlife.vn',
        password: 'member123'
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('Register creates new member account', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Register Test User',
        email: `register.${Date.now()}@fitlife.vn`,
        password: 'member123',
        phone: '0909123456',
        gender: 'female',
        date_of_birth: '2002-02-02'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('member');
    expect(res.body.data.member.member_code).toBeDefined();
  });

  test('Me requires valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.statusCode).toBe(401);
  });
});

describe('Coverage Boost - Plans', () => {
  test('Create plan validates required fields', async () => {
    const res = await request(app)
      .post('/api/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Invalid Plan'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Get non-existing plan returns 404', async () => {
    const res = await request(app)
      .get('/api/plans/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('Update non-existing plan returns 404', async () => {
    const res = await request(app)
      .put('/api/plans/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        price: 999000
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('Delete non-existing plan returns 404', async () => {
    const res = await request(app)
      .delete('/api/plans/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Coverage Boost - Classes', () => {
  test('Create class validates required fields', async () => {
    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Invalid Class'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Update non-existing class returns 404', async () => {
    const res = await request(app)
      .put('/api/classes/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        room: 'Room 404'
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('Delete non-existing class returns 404', async () => {
    const res = await request(app)
      .delete('/api/classes/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Coverage Boost - Bookings', () => {
  test('Booking rejects duplicate active booking', async () => {
    const first = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        member_id: 1,
        class_id: 2,
        note: 'Duplicate test first booking'
      });

    expect([201, 409]).toContain(first.statusCode);

    const second = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        member_id: 1,
        class_id: 2,
        note: 'Duplicate test second booking'
      });

    expect(second.statusCode).toBe(409);
    expect(second.body.success).toBe(false);
  });

  test('Booking rejects non-existing class', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        member_id: 1,
        class_id: 99999
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('Booking rejects invalid status update', async () => {
    const res = await request(app)
      .put('/api/bookings/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'invalid_status'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Booking status update returns 404 for missing booking', async () => {
    const res = await request(app)
      .put('/api/bookings/99999/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'completed'
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Coverage Boost - Payments and Checkins', () => {
  test('Create payment validates required fields', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        member_id: 1
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Pay debt validates paid amount', async () => {
    const res = await request(app)
      .put('/api/payments/1/pay-debt')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        paid_amount: 0
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Pay debt returns 404 for missing payment', async () => {
    const res = await request(app)
      .put('/api/payments/99999/pay-debt')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        paid_amount: 100000
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('Checkin rejects expired member membership', async () => {
    const res = await request(app)
      .post('/api/checkins')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        member_id: 4,
        method: 'manual'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Member cannot create checkin', async () => {
    const res = await request(app)
      .post('/api/checkins')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        member_id: 1,
        method: 'manual'
      });

    expect(res.statusCode).toBe(403);
  });
});