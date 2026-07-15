const request = require('supertest');
const app = require('../src/app');

let adminToken;
let memberToken;
let createdTrainerId;

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

describe('Trainers API', () => {
  test('Authenticated user can get trainers list', async () => {
    const res = await request(app)
      .get('/api/trainers')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.trainers)).toBe(true);
  });

  test('Admin can get trainer detail with schedule and notes', async () => {
    const res = await request(app)
      .get('/api/trainers/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trainer.id).toBe(1);
    expect(Array.isArray(res.body.data.schedule)).toBe(true);
    expect(Array.isArray(res.body.data.notes)).toBe(true);
  });

  test('Admin can create trainer', async () => {
    const uniqueEmail = `trainer.test.${Date.now()}@fitlife.vn`;

    const res = await request(app)
      .post('/api/trainers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        full_name: 'Trainer Test',
        email: uniqueEmail,
        password: 'trainer123',
        phone: '0912345678',
        specialty: 'Functional Training',
        experience_years: 3,
        bio: 'Trainer created by automated test'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trainer.email).toBe(uniqueEmail);

    createdTrainerId = res.body.data.trainer.id;
  });

  test('Admin can update trainer', async () => {
    const res = await request(app)
      .put(`/api/trainers/${createdTrainerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        specialty: 'Strength & Conditioning',
        experience_years: 4,
        bio: 'Updated trainer bio'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Admin can create trainer note', async () => {
    const res = await request(app)
      .post('/api/trainers/notes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        member_id: 2,
        trainer_id: 1,
        note: 'Test trainer note',
        goal: 'Improve endurance'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.note.member_id).toBe(2);
  });

  test('Member cannot create trainer', async () => {
    const res = await request(app)
      .post('/api/trainers')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        full_name: 'Invalid Trainer',
        email: `invalid.trainer.${Date.now()}@fitlife.vn`
      });

    expect(res.statusCode).toBe(403);
  });

  test('Member cannot view trainer detail', async () => {
    const res = await request(app)
      .get('/api/trainers/1')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('Create trainer validates required fields', async () => {
    const res = await request(app)
      .post('/api/trainers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        full_name: 'Missing Email'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Get non-existing trainer returns 404', async () => {
    const res = await request(app)
      .get('/api/trainers/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('Admin can deactivate trainer', async () => {
    const res = await request(app)
      .delete(`/api/trainers/${createdTrainerId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});