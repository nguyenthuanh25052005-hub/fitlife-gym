const request = require('supertest');
const app = require('../src/app');

let adminToken;
let memberToken;
let createdMembershipId;
let createdBookingId;
let createdClassId;
let managedMemberId;
let consultationId;

const auth = (token) => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  const [adminLogin, memberLogin] = await Promise.all([
    request(app).post('/api/auth/login').send({ email: 'admin@fitlife.vn', password: 'admin123' }),
    request(app).post('/api/auth/login').send({ email: 'ha.member@fitlife.vn', password: 'member123' })
  ]);
  adminToken = adminLogin.body.data.token;
  memberToken = memberLogin.body.data.token;
});

describe('Member self-service workflow', () => {
  test('role protection rejects admin on member routes', async () => {
    const res = await request(app).get('/api/user/profile').set(auth(adminToken));
    expect(res.statusCode).toBe(403);
  });

  test('member dashboard and profile are available', async () => {
    const dashboard = await request(app).get('/api/user/dashboard').set(auth(memberToken));
    expect(dashboard.statusCode).toBe(200);
    expect(dashboard.body.data).toHaveProperty('membership');

    const profile = await request(app).get('/api/user/profile').set(auth(memberToken));
    expect(profile.statusCode).toBe(200);
    expect(profile.body.data.profile.member_code).toBe('MB001');
  });

  test('member can update profile', async () => {
    const res = await request(app)
      .put('/api/user/profile')
      .set(auth(memberToken))
      .send({ full_name: 'Lê Thu Hà', phone: '0900001234', address: 'Hà Nội', health_note: 'Khỏe mạnh' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('change password validates input, current password, and can restore password', async () => {
    const missing = await request(app).put('/api/user/change-password').set(auth(memberToken)).send({});
    expect(missing.statusCode).toBe(400);

    const short = await request(app).put('/api/user/change-password').set(auth(memberToken))
      .send({ current_password: 'member123', new_password: '123' });
    expect(short.statusCode).toBe(400);

    const wrong = await request(app).put('/api/user/change-password').set(auth(memberToken))
      .send({ current_password: 'wrong', new_password: 'member456' });
    expect(wrong.statusCode).toBe(400);

    const changed = await request(app).put('/api/user/change-password').set(auth(memberToken))
      .send({ current_password: 'member123', new_password: 'member456' });
    expect(changed.statusCode).toBe(200);

    const restored = await request(app).put('/api/user/change-password').set(auth(memberToken))
      .send({ current_password: 'member456', new_password: 'member123' });
    expect(restored.statusCode).toBe(200);
  });

  test('body metrics validation, update, history and health advice work', async () => {
    const invalid = await request(app).put('/api/user/body-metrics').set(auth(memberToken)).send({ height: 160 });
    expect(invalid.statusCode).toBe(400);

    const updated = await request(app).put('/api/user/body-metrics').set(auth(memberToken))
      .send({ height: 160, weight: 52, body_fat: 22, muscle_mass: 36 });
    expect(updated.statusCode).toBe(201);
    expect(updated.body.data.bmi).toBeGreaterThan(0);

    const history = await request(app).get('/api/user/body-metrics').set(auth(memberToken));
    expect(history.statusCode).toBe(200);
    expect(history.body.data.metrics.length).toBeGreaterThan(0);

    const advice = await request(app).get('/api/user/health-advice').set(auth(memberToken));
    expect(advice.statusCode).toBe(200);
    expect(advice.body.data.category).toBeDefined();
  });

  test('member memberships list and buy-plan validations work', async () => {
    const list = await request(app).get('/api/user/memberships').set(auth(memberToken));
    expect(list.statusCode).toBe(200);
    expect(Array.isArray(list.body.data.memberships)).toBe(true);

    const missing = await request(app).post('/api/user/buy-plan').set(auth(memberToken)).send({});
    expect(missing.statusCode).toBe(400);

    const notFound = await request(app).post('/api/user/buy-plan').set(auth(memberToken)).send({ plan_id: 99999 });
    expect(notFound.statusCode).toBe(404);

    const purchased = await request(app).post('/api/user/buy-plan').set(auth(memberToken))
      .send({ plan_id: 4, method: 'qr' });
    expect(purchased.statusCode).toBe(201);
    expect(purchased.body.data.membership.status).toBe('frozen');
    createdMembershipId = purchased.body.data.membership.id;
  });

  test('payment QR validates ownership and returns VietQR data', async () => {
    const missing = await request(app).post('/api/user/create-qr').set(auth(memberToken)).send({});
    expect(missing.statusCode).toBe(400);

    const notFound = await request(app).post('/api/user/create-qr').set(auth(memberToken))
      .send({ membership_id: 99999, amount: 1000 });
    expect(notFound.statusCode).toBe(404);

    const qr = await request(app).post('/api/user/create-qr').set(auth(memberToken))
      .send({ membership_id: createdMembershipId, amount: 800000 });
    expect(qr.statusCode).toBe(200);
    expect(qr.body.data.qr_url).toContain('vietqr.io');
  });

  test('payment confirmation validates proof, can be submitted and cancelled', async () => {
    const missing = await request(app).post('/api/user/payment-confirmation').set(auth(memberToken)).send({});
    expect(missing.statusCode).toBe(400);

    const invalidProof = await request(app).post('/api/user/payment-confirmation').set(auth(memberToken))
      .send({ membership_id: createdMembershipId, proof_image: 'not-an-image' });
    expect(invalidProof.statusCode).toBe(400);

    const submitted = await request(app).post('/api/user/payment-confirmation').set(auth(memberToken))
      .send({
        membership_id: createdMembershipId,
        note: 'Đã chuyển khoản',
        proof_image: 'data:image/png;base64,aGVsbG8=',
        proof_filename: 'receipt.png'
      });
    expect(submitted.statusCode).toBe(200);

    const cancelled = await request(app)
      .put(`/api/user/payment-confirmation/${createdMembershipId}/cancel`)
      .set(auth(memberToken));
    expect(cancelled.statusCode).toBe(200);
  });

  test('member can cancel own new membership and handles missing membership', async () => {
    const missing = await request(app).put('/api/user/memberships/99999/cancel').set(auth(memberToken)).send({});
    expect(missing.statusCode).toBe(404);

    const res = await request(app)
      .put(`/api/user/memberships/${createdMembershipId}/cancel`)
      .set(auth(memberToken))
      .send({ note: 'Đổi kế hoạch tập' });
    expect(res.statusCode).toBe(200);
  });

  test('membership upgrade validates data and upgrades an active membership', async () => {
    const missingPlan = await request(app).put('/api/user/memberships/1/upgrade').set(auth(memberToken)).send({});
    expect(missingPlan.statusCode).toBe(400);

    const badPlan = await request(app).put('/api/user/memberships/1/upgrade').set(auth(memberToken))
      .send({ new_plan_id: 99999 });
    expect(badPlan.statusCode).toBe(404);

    const badMembership = await request(app).put('/api/user/memberships/99999/upgrade').set(auth(memberToken))
      .send({ new_plan_id: 2 });
    expect(badMembership.statusCode).toBe(404);

    const upgraded = await request(app).put('/api/user/memberships/1/upgrade').set(auth(memberToken))
      .send({ new_plan_id: 2 });
    expect(upgraded.statusCode).toBe(200);
    expect(upgraded.body.data.new_plan).toBeDefined();
  });

  test('coach endpoints validate and change coach', async () => {
    const coach = await request(app).get('/api/user/coach').set(auth(memberToken));
    expect(coach.statusCode).toBe(200);

    const missing = await request(app).put('/api/user/coach').set(auth(memberToken)).send({});
    expect(missing.statusCode).toBe(400);

    const bad = await request(app).put('/api/user/coach').set(auth(memberToken)).send({ trainer_id: 99999 });
    expect(bad.statusCode).toBe(404);

    const changed = await request(app).put('/api/user/coach').set(auth(memberToken)).send({ trainer_id: 2 });
    expect(changed.statusCode).toBe(200);
  });

  test('member booking flow validates, books, lists and cancels', async () => {
    const createdClass = await request(app).post('/api/classes').set(auth(adminToken)).send({
      name: `Member Flow ${Date.now()}`,
      class_type: 'Yoga', trainer_id: 2, room: 'Studio C',
      start_time: '2026-09-01 07:00', end_time: '2026-09-01 08:00', capacity: 10
    });
    expect(createdClass.statusCode).toBe(201);
    createdClassId = createdClass.body.data.class.id;

    const missing = await request(app).post('/api/user/book-class').set(auth(memberToken)).send({});
    expect(missing.statusCode).toBe(400);

    const badClass = await request(app).post('/api/user/book-class').set(auth(memberToken)).send({ class_id: 99999 });
    expect(badClass.statusCode).toBe(404);

    const booked = await request(app).post('/api/user/book-class').set(auth(memberToken)).send({ class_id: createdClassId });
    expect(booked.statusCode).toBe(201);
    createdBookingId = booked.body.data.id;

    const duplicate = await request(app).post('/api/user/book-class').set(auth(memberToken)).send({ class_id: createdClassId });
    expect(duplicate.statusCode).toBe(400);

    const list = await request(app).get('/api/user/bookings').set(auth(memberToken));
    expect(list.statusCode).toBe(200);
    expect(Array.isArray(list.body.data.bookings)).toBe(true);

    const missingBooking = await request(app).put('/api/user/bookings/99999/cancel').set(auth(memberToken));
    expect(missingBooking.statusCode).toBe(404);

    const cancelled = await request(app).put(`/api/user/bookings/${createdBookingId}/cancel`).set(auth(memberToken));
    expect(cancelled.statusCode).toBe(200);
  });

  test('member notification read endpoint succeeds', async () => {
    const res = await request(app).put('/api/user/notifications/1/read').set(auth(memberToken));
    expect(res.statusCode).toBe(200);
  });
});

describe('Consultation workflow', () => {
  test('public consultation validates required fields', async () => {
    const res = await request(app).post('/api/consultations').send({ full_name: 'Khách hàng' });
    expect(res.statusCode).toBe(400);
  });

  test('public can create consultation', async () => {
    const res = await request(app).post('/api/consultations').send({
      full_name: 'Khách FitLife', phone: '0912345678',
      email: `consult.${Date.now()}@example.com`, interested_product: 'Premium'
    });
    expect(res.statusCode).toBe(201);
    consultationId = res.body.data.consultation.id;
  });

  test('member cannot list consultations and admin can', async () => {
    const denied = await request(app).get('/api/consultations').set(auth(memberToken));
    expect(denied.statusCode).toBe(403);

    const list = await request(app).get('/api/consultations?page=1&limit=5&status=PENDING').set(auth(adminToken));
    expect(list.statusCode).toBe(200);
    expect(Array.isArray(list.body.data.consultations)).toBe(true);
  });

  test('consultation status validates and updates', async () => {
    const invalid = await request(app).put(`/api/consultations/${consultationId}/status`).set(auth(adminToken))
      .send({ status: 'INVALID' });
    expect(invalid.statusCode).toBe(400);

    const missing = await request(app).put('/api/consultations/99999/status').set(auth(adminToken))
      .send({ status: 'CONTACTED' });
    expect(missing.statusCode).toBe(404);

    const updated = await request(app).put(`/api/consultations/${consultationId}/status`).set(auth(adminToken))
      .send({ status: 'CONTACTED' });
    expect(updated.statusCode).toBe(200);
    expect(updated.body.data.consultation.status).toBe('CONTACTED');
  });
});

describe('Admin operations', () => {
  test('admin notification list and mark-read work', async () => {
    const list = await request(app).get('/api/admin/notifications?page=1&limit=10').set(auth(adminToken));
    expect(list.statusCode).toBe(200);
    expect(Array.isArray(list.body.data.notifications)).toBe(true);

    const notificationId = list.body.data.notifications[0]?.id || 99999;
    const read = await request(app).put(`/api/admin/notifications/${notificationId}/read`).set(auth(adminToken));
    expect(read.statusCode).toBe(200);
  });

  test('admin member management can search, lock, unlock and deactivate a new member', async () => {
    const unique = Date.now();
    const created = await request(app).post('/api/members').set(auth(adminToken)).send({
      full_name: 'Member Admin Flow', email: `admin.flow.${unique}@fitlife.vn`, password: 'member123',
      phone: '0987654321', gender: 'male', date_of_birth: '2000-01-01'
    });
    expect(created.statusCode).toBe(201);
    managedMemberId = created.body.data.member.id;

    const list = await request(app).get('/api/admin/members?search=Member%20Admin%20Flow&status=active').set(auth(adminToken));
    expect(list.statusCode).toBe(200);

    const lock = await request(app).put(`/api/admin/members/${managedMemberId}/lock`).set(auth(adminToken));
    expect(lock.statusCode).toBe(200);

    const unlock = await request(app).put(`/api/admin/members/${managedMemberId}/unlock`).set(auth(adminToken));
    expect(unlock.statusCode).toBe(200);

    const deactivate = await request(app).delete(`/api/admin/members/${managedMemberId}`).set(auth(adminToken));
    expect(deactivate.statusCode).toBe(200);
  });

  test('admin member actions return 404 for missing records', async () => {
    const lock = await request(app).put('/api/admin/members/99999/lock').set(auth(adminToken));
    const unlock = await request(app).put('/api/admin/members/99999/unlock').set(auth(adminToken));
    const remove = await request(app).delete('/api/admin/members/99999').set(auth(adminToken));
    expect(lock.statusCode).toBe(404);
    expect(unlock.statusCode).toBe(404);
    expect(remove.statusCode).toBe(404);
  });
});

describe('Payment approval workflow and observability', () => {
  const createPendingPayment = async (planId) => {
    const purchased = await request(app).post('/api/user/buy-plan').set(auth(memberToken))
      .send({ plan_id: planId, method: 'bank_transfer' });
    expect(purchased.statusCode).toBe(201);
    const membershipId = purchased.body.data.membership.id;

    const submitted = await request(app).post('/api/user/payment-confirmation').set(auth(memberToken))
      .send({
        membership_id: membershipId,
        note: 'Bằng chứng chuyển khoản',
        proof_image: 'data:image/jpeg;base64,aGVsbG8=',
        proof_filename: 'bank.jpg'
      });
    expect(submitted.statusCode).toBe(200);

    const payments = await request(app).get('/api/payments').set(auth(adminToken));
    const payment = payments.body.data.payments.find((item) => item.membership_id === membershipId);
    expect(payment).toBeDefined();
    return payment.id;
  };

  test('admin can approve pending payment and member receives notification', async () => {
    const paymentId = await createPendingPayment(1);
    const approved = await request(app).put(`/api/payments/${paymentId}/confirm`).set(auth(adminToken));
    expect(approved.statusCode).toBe(200);
    expect(approved.body.success).toBe(true);

    const notifications = await request(app).get('/api/payments/notifications').set(auth(memberToken));
    expect(notifications.statusCode).toBe(200);
    expect(Array.isArray(notifications.body.data.notifications)).toBe(true);
  });

  test('admin can reject pending payment and invalid confirmations are handled', async () => {
    const missing = await request(app).put('/api/payments/99999/confirm').set(auth(adminToken));
    expect(missing.statusCode).toBe(404);

    const paymentId = await createPendingPayment(3);
    const rejected = await request(app).put(`/api/payments/${paymentId}/reject`).set(auth(adminToken))
      .send({ note: 'Ảnh chưa rõ' });
    expect(rejected.statusCode).toBe(200);

    const confirmWithoutPending = await request(app).put(`/api/payments/${paymentId}/confirm`).set(auth(adminToken));
    expect(confirmWithoutPending.statusCode).toBe(400);
  });

  test('root, health and Prometheus metrics endpoints are available', async () => {
    const root = await request(app).get('/');
    const health = await request(app).get('/api/health').set('x-request-id', 'quality-test-id');
    const metrics = await request(app).get('/metrics');
    expect(root.statusCode).toBe(200);
    expect(health.statusCode).toBe(200);
    expect(metrics.statusCode).toBe(200);
    expect(metrics.text).toContain('fitlife_http_requests_total');
  });
});
