const request = require('supertest');
const app = require('../src/app');

let adminToken;
let memberToken;
let createdClassId;
let createdBookingId;
let createdPaymentId;

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

describe('Payments API', () => {
  test('Admin can get payments list', async () => {
    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.payments)).toBe(true);
  });

  test('Admin can get debts list', async () => {
    const res = await request(app)
      .get('/api/payments/debts')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.debts)).toBe(true);
  });

  test('Admin can create payment', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        member_id: 1,
        amount: 1000000,
        paid_amount: 500000,
        method: 'cash',
        note: 'Test payment'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.status).toBe('partial');

    createdPaymentId = res.body.data.payment.id;
  });

  test('Admin can pay debt', async () => {
    const res = await request(app)
      .put(`/api/payments/${createdPaymentId}/pay-debt`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        paid_amount: 500000,
        note: 'Pay remaining debt'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.status).toBe('paid');
  });

  test('Member cannot access payments list', async () => {
    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(403);
  });
});

describe('Checkins API', () => {
  test('Admin can get checkins list', async () => {
    const res = await request(app)
      .get('/api/checkins')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.checkins)).toBe(true);
  });

  test('Admin can create checkin', async () => {
    const res = await request(app)
      .post('/api/checkins')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        member_id: 1,
        method: 'manual',
        note: 'Test checkin'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.checkin.member_id).toBe(1);
  });

  test('Checkin validates member_id', async () => {
    const res = await request(app)
      .post('/api/checkins')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        method: 'manual'
      });

    expect(res.statusCode).toBe(400);
  });
});

describe('Classes API', () => {
  test('Authenticated user can get classes list', async () => {
    const res = await request(app)
      .get('/api/classes')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.classes)).toBe(true);
  });

  test('Admin can create class', async () => {
    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Test Class ${Date.now()}`,
        class_type: 'Cardio',
        trainer_id: 1,
        room: 'Studio Test',
        start_time: '2026-08-10 08:00',
        end_time: '2026-08-10 09:00',
        capacity: 10
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);

    createdClassId = res.body.data.class.id;
  });

  test('Admin can update class', async () => {
    const res = await request(app)
      .put(`/api/classes/${createdClassId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        room: 'Studio Updated'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Member cannot create class', async () => {
    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        name: 'Member Class',
        class_type: 'Yoga',
        start_time: '2026-08-10 08:00',
        end_time: '2026-08-10 09:00'
      });

    expect(res.statusCode).toBe(403);
  });
});

describe('Bookings API', () => {
  test('Admin can get bookings list', async () => {
    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.bookings)).toBe(true);
  });

  test('Admin can create booking for member with active membership', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        member_id: 1,
        class_id: createdClassId,
        note: 'Test booking'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);

    createdBookingId = res.body.data.booking.id;
  });

  test('Admin can complete booking', async () => {
    const res = await request(app)
      .put(`/api/bookings/${createdBookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'completed',
        note: 'Completed in test'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Booking validates class_id', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        member_id: 1
      });

    expect(res.statusCode).toBe(400);
  });

  test('Member cannot access all bookings list', async () => {
    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(403);
  });
});