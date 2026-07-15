const request = require('supertest');
const app = require('../src/app');

let adminToken;
let memberToken;
let createdPlanId;
let createdMembershipId;

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

describe('Plans API', () => {
  test('Authenticated user can get plans list', async () => {
    const res = await request(app)
      .get('/api/plans')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.plans)).toBe(true);
  });

  test('Admin can create a plan', async () => {
    const res = await request(app)
      .post('/api/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Test Plan ${Date.now()}`,
        description: 'Gói test tự động',
        plan_type: 'basic',
        duration_days: 30,
        session_limit: null,
        price: 600000
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);

    createdPlanId = res.body.data.plan.id;
  });

  test('Admin can get plan detail', async () => {
    const res = await request(app)
      .get(`/api/plans/${createdPlanId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.plan.id).toBe(createdPlanId);
  });

  test('Admin can update a plan', async () => {
    const res = await request(app)
      .put(`/api/plans/${createdPlanId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        price: 700000,
        status: 'active'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Member cannot create plan', async () => {
    const res = await request(app)
      .post('/api/plans')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        name: 'Member Plan',
        plan_type: 'basic',
        duration_days: 30,
        price: 500000
      });

    expect(res.statusCode).toBe(403);
  });
});

describe('Memberships API', () => {
  test('Admin can get memberships list', async () => {
    const res = await request(app)
      .get('/api/memberships')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.memberships)).toBe(true);
  });

  test('Admin can create membership with payment', async () => {
    const res = await request(app)
      .post('/api/memberships')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        member_id: 1,
        plan_id: createdPlanId,
        start_date: '2026-08-01',
        paid_amount: 300000,
        method: 'cash',
        note: 'Test đăng ký gói mới'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.membership.member_id).toBe(1);
    expect(res.body.data.payment.status).toBe('partial');

    createdMembershipId = res.body.data.membership.id;
  });

  test('Admin can get membership detail with actions', async () => {
    const res = await request(app)
      .get(`/api/memberships/${createdMembershipId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.membership.id).toBe(createdMembershipId);
    expect(Array.isArray(res.body.data.actions)).toBe(true);
  });

  test('Admin can renew membership', async () => {
    const res = await request(app)
      .put(`/api/memberships/${createdMembershipId}/renew`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        extra_days: 30,
        paid_amount: 700000,
        method: 'bank_transfer',
        note: 'Test gia hạn gói'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.new_end_date).toBeDefined();
  });

  test('Admin can freeze membership', async () => {
    const res = await request(app)
      .put(`/api/memberships/${createdMembershipId}/freeze`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        note: 'Test bảo lưu'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Admin can unfreeze membership', async () => {
    const res = await request(app)
      .put(`/api/memberships/${createdMembershipId}/unfreeze`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        note: 'Test kích hoạt lại'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Admin can cancel membership', async () => {
    const res = await request(app)
      .put(`/api/memberships/${createdMembershipId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        note: 'Test hủy gói'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Member cannot access memberships list', async () => {
    const res = await request(app)
      .get('/api/memberships')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('Create membership validates required fields', async () => {
    const res = await request(app)
      .post('/api/memberships')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        member_id: 1
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
}); 