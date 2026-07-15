const request = require('supertest');
const app = require('../src/app');

let adminToken;
let memberToken;
let createdMemberId;

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

describe('Members API', () => {
  test('Admin can get members list', async () => {
    const res = await request(app)
      .get('/api/members?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.members)).toBe(true);
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(1);
  });

  test('Admin can search member by code', async () => {
    const res = await request(app)
      .get('/api/members?search=MB003')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(
      res.body.data.members.some(
        (member) => member.member_code === 'MB003'
      )
    ).toBe(true);
  });

  test('Admin can get member 360 profile', async () => {
    const res = await request(app)
      .get('/api/members/2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profile.member_code).toBe('MB002');
    expect(Array.isArray(res.body.data.memberships)).toBe(true);
    expect(Array.isArray(res.body.data.payments)).toBe(true);
    expect(Array.isArray(res.body.data.checkins)).toBe(true);
    expect(Array.isArray(res.body.data.body_metrics)).toBe(true);
  });

  test('Member cannot access members management', async () => {
    const res = await request(app)
      .get('/api/members')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('Members list requires authentication', async () => {
    const res = await request(app)
      .get('/api/members');

    expect(res.statusCode).toBe(401);
  });

  test('Admin can create a new member', async () => {
    const uniqueEmail = `test.member.${Date.now()}@fitlife.vn`;

    const res = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        full_name: 'Test Hội Viên',
        email: uniqueEmail,
        password: 'member123',
        phone: '0999999999',
        gender: 'male',
        date_of_birth: '2001-01-01',
        address: 'Hà Nội',
        emergency_contact: '0988888888',
        health_note: 'Không có'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.member.email).toBe(uniqueEmail);

    createdMemberId = res.body.data.member.id;
  });

  test('Admin can update a member', async () => {
    const res = await request(app)
      .put(`/api/members/${createdMemberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        full_name: 'Test Hội Viên Updated',
        phone: '0977777777',
        health_note: 'Đã cập nhật'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Admin can delete a member', async () => {
    const res = await request(app)
      .delete(`/api/members/${createdMemberId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Get non-existing member returns 404', async () => {
    const res = await request(app)
      .get('/api/members/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});