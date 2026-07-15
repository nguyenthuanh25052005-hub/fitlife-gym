const { EventEmitter } = require('events');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

jest.mock('../src/database/db', () => ({
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn(),
}));

const db = require('../src/database/db');
const admin = require('../src/modules/admin/adminController');
const report = require('../src/modules/reports/reportController');
const authenticate = require('../src/middleware/authMiddleware');
const authorize = require('../src/middleware/roleMiddleware');

const waitForStatus = async (res, expected = 500) => {
  for (let attempt = 0; attempt < 100 && res.statusCode !== expected; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
};

const response = () => {
  const res = {
    statusCode: 200,
    payload: undefined,
    status: jest.fn((code) => {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn((payload) => {
      res.payload = payload;
      return res;
    }),
    type: jest.fn(() => res),
    send: jest.fn((payload) => {
      res.payload = payload;
      return res;
    }),
  };
  return res;
};

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'fitlife_test_secret';
});

let consoleErrorSpy;

beforeEach(() => {
  jest.resetAllMocks();
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe('Admin controller defensive branches', () => {
  test('notification list handles list and count database errors', () => {
    const res1 = response();
    db.all.mockImplementationOnce((_sql, _params, cb) => cb(new Error('list failed')));
    admin.getNotifications({ query: {} }, res1);
    expect(res1.statusCode).toBe(500);

    const res2 = response();
    db.all.mockImplementationOnce((_sql, _params, cb) => cb(null, []));
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('count failed')));
    admin.getNotifications({ query: { page: 'bad', limit: '500' } }, res2);
    expect(res2.statusCode).toBe(500);
  });

  test('notification list computes unread and sanitized pagination', () => {
    const res = response();
    db.all.mockImplementationOnce((_sql, params, cb) => {
      expect(params).toEqual([20, 0]);
      cb(null, [{ is_read: 0 }, { is_read: null }, { is_read: 1 }]);
    });
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { total: 3 }));
    admin.getNotifications({ query: { page: '0', limit: '0' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.payload.data.unread_count).toBe(2);
  });

  test('mark notification handles update error and success', () => {
    const fail = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb(new Error('update failed')));
    admin.markNotificationRead({ params: { id: 1 } }, fail);
    expect(fail.statusCode).toBe(500);

    const ok = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb(null));
    admin.markNotificationRead({ params: { id: 1 } }, ok);
    expect(ok.statusCode).toBe(200);
  });

  test('create notification resolves and rejects based on insert result', async () => {
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ lastID: 9 }, null));
    await expect(admin.createNotification('system', 'A', 'B')).resolves.toBe(9);

    db.run.mockImplementationOnce((_sql, _params, cb) => cb(new Error('insert failed')));
    await expect(admin.createNotification('system', 'A', 'B', 1)).rejects.toThrow('insert failed');
  });

  test('member management handles count and list errors plus filters', () => {
    const countFail = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('count')));
    admin.getMemberManagement({ query: {} }, countFail);
    expect(countFail.statusCode).toBe(500);

    const listFail = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { total: 1 }));
    db.all.mockImplementationOnce((_sql, _params, cb) => cb(new Error('list')));
    admin.getMemberManagement({ query: { search: ' Mai ', status: 'active', page: '-2', limit: '999' } }, listFail);
    expect(listFail.statusCode).toBe(500);

    const ok = response();
    db.get.mockImplementationOnce((_sql, params, cb) => {
      expect(params).toEqual(['member', '%Mai%', '%Mai%', '%Mai%', '%Mai%', 'active']);
      cb(null, { total: 1 });
    });
    db.all.mockImplementationOnce((_sql, params, cb) => {
      expect(params.slice(-2)).toEqual([100, 0]);
      cb(null, [{ member_id: 1 }]);
    });
    admin.getMemberManagement({ query: { search: ' Mai ', status: 'active', page: '-2', limit: '999' } }, ok);
    expect(ok.statusCode).toBe(200);
  });

  test.each([
    ['lockMember', 'Không thể khóa tài khoản'],
    ['unlockMember', 'Không thể mở khóa tài khoản'],
    ['deleteMemberAccount', 'Không thể vô hiệu hóa tài khoản'],
  ])('%s handles query miss, query error, update error and success', (methodName, updateMessage) => {
    const method = admin[methodName];

    const missing = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    method({ params: { id: 99 } }, missing);
    expect(missing.statusCode).toBe(404);

    const queryError = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('query')));
    method({ params: { id: 99 } }, queryError);
    expect(queryError.statusCode).toBe(404);

    const updateError = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { user_id: 4 }));
    db.run.mockImplementationOnce((_sql, _params, cb) => cb(new Error('update')));
    method({ params: { id: 1 } }, updateError);
    expect(updateError.statusCode).toBe(500);
    expect(updateError.payload.message).toBe(updateMessage);

    const ok = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { user_id: 4 }));
    db.run.mockImplementationOnce((_sql, _params, cb) => cb(null));
    method({ params: { id: 1 } }, ok);
    expect(ok.statusCode).toBe(200);
  });
});

describe('Authentication and authorization failure branches', () => {
  test('authenticate handles database error, missing user, disabled user and valid user', () => {
    const token = jwt.sign({ id: 4, role: 'member' }, process.env.JWT_SECRET);
    const req = () => ({ headers: { authorization: `Bearer ${token}` } });

    const dbFailRes = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('db')));
    authenticate(req(), dbFailRes, jest.fn());
    expect(dbFailRes.statusCode).toBe(500);

    const missingRes = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    authenticate(req(), missingRes, jest.fn());
    expect(missingRes.statusCode).toBe(401);

    const disabledRes = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 4, role: 'member', status: 'locked' }));
    authenticate(req(), disabledRes, jest.fn());
    expect(disabledRes.statusCode).toBe(403);

    const validReq = req();
    const next = jest.fn();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 4, role: 'member', status: 'active' }));
    authenticate(validReq, response(), next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(validReq.user).toEqual({ id: 4, role: 'member' });
  });

  test('authorize handles missing, denied and allowed roles', () => {
    const middleware = authorize('admin');
    const noUser = response();
    middleware({}, noUser, jest.fn());
    expect(noUser.statusCode).toBe(401);

    const denied = response();
    middleware({ user: { role: 'member' } }, denied, jest.fn());
    expect(denied.statusCode).toBe(403);

    const next = jest.fn();
    middleware({ user: { role: 'admin' } }, response(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('Report and observability error branches', () => {
  test('dashboard returns 500 when a scalar query fails', async () => {
    db.get.mockImplementation((_sql, _params, cb) => cb(new Error('query failed')));
    db.all.mockImplementation((_sql, _params, cb) => cb(null, []));
    const res = response();
    await report.getDashboard({}, res);
    expect(res.statusCode).toBe(500);
  });

  test('dashboard returns 500 when a list query fails', async () => {
    db.get.mockImplementation((_sql, _params, cb) => cb(null, { total: 0, total_revenue: 0, total_debt: 0 }));
    db.all.mockImplementation((_sql, _params, cb) => cb(new Error('list failed')));
    const res = response();
    await report.getDashboard({}, res);
    expect(res.statusCode).toBe(500);
  });

  test('observability exports zero metrics and counts a 500 response', () => {
    jest.resetModules();
    process.env.LOG_TEST_REQUESTS = 'true';
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { observabilityMiddleware, metricsHandler } = require('../src/middleware/observabilityMiddleware');

    const metricsBefore = response();
    metricsHandler({}, metricsBefore);
    expect(metricsBefore.payload).toContain('fitlife_http_request_duration_ms_avg 0.00');

    const req = {
      method: 'GET',
      originalUrl: '/failure',
      get: jest.fn(() => 'fixed-request-id'),
    };
    const res = new EventEmitter();
    res.statusCode = 500;
    res.setHeader = jest.fn();
    observabilityMiddleware(req, res, jest.fn());
    res.emit('finish');

    const metricsAfter = response();
    metricsHandler({}, metricsAfter);
    expect(metricsAfter.payload).toContain('fitlife_http_errors_total 1');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'fixed-request-id');
    delete process.env.LOG_TEST_REQUESTS;
    consoleLogSpy.mockRestore();
  });
});

describe('Auth controller defensive branches', () => {
  const authController = require('../src/modules/auth/authController');
  const flush = () => new Promise((resolve) => setImmediate(resolve));

  test('login handles query error and inactive user', async () => {
    const dbError = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('db')));
    authController.login({ body: { email: 'a@b.com', password: 'secret' } }, dbError);
    await flush();
    expect(dbError.statusCode).toBe(500);

    const inactive = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1, status: 'locked' }));
    authController.login({ body: { email: 'a@b.com', password: 'secret' } }, inactive);
    await flush();
    expect(inactive.statusCode).toBe(403);
  });

  test('register validates required data and handles lookup and user insert errors', async () => {
    const missing = response();
    await authController.register({ body: {} }, missing);
    expect(missing.statusCode).toBe(400);

    const lookupError = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('lookup')));
    await authController.register({ body: { full_name: 'A', email: 'a@b.com', password: '123456' } }, lookupError);
    await flush();
    expect(lookupError.statusCode).toBe(500);

    jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('hashed-password');
    const insertError = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    db.run.mockImplementationOnce((_sql, _params, cb) => cb(new Error('insert')));
    await authController.register({ body: { full_name: 'A', email: 'a@b.com', password: '123456' } }, insertError);
    await waitForStatus(insertError);
    expect(insertError.statusCode).toBe(500);
  });

  test('register removes user when member creation fails and catches unexpected errors', async () => {
    jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('hashed-password');
    const memberError = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    db.run
      .mockImplementationOnce((_sql, _params, cb) => cb.call({ lastID: 77 }, null))
      .mockImplementationOnce((_sql, _params, cb) => cb(new Error('member insert')))
      .mockImplementationOnce((_sql, _params, cb) => cb?.(null));
    await authController.register({ body: { full_name: 'A', email: 'a@b.com', password: '123456' } }, memberError);
    await waitForStatus(memberError);
    expect(memberError.statusCode).toBe(500);
    expect(db.run).toHaveBeenCalledTimes(3);

    const unexpected = response();
    const req = {};
    Object.defineProperty(req, 'body', { get() { throw new Error('unexpected'); } });
    await authController.register(req, unexpected);
    expect(unexpected.statusCode).toBe(500);
  });

  test('getMe handles query error, missing account and disabled account', () => {
    const dbError = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('db')));
    authController.getMe({ user: { id: 1 } }, dbError);
    expect(dbError.statusCode).toBe(500);

    const missing = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    authController.getMe({ user: { id: 1 } }, missing);
    expect(missing.statusCode).toBe(401);

    const disabled = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1, status: 'inactive' }));
    authController.getMe({ user: { id: 1 } }, disabled);
    expect(disabled.statusCode).toBe(403);
  });
});

describe('Payment controller defensive branches', () => {
  const payments = require('../src/modules/payments/paymentController');

  test('payment list handles count/list errors and status filter', () => {
    const countFail = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('count')));
    payments.getAllPayments({ query: {} }, countFail);
    expect(countFail.statusCode).toBe(500);

    const listFail = response();
    db.get.mockImplementationOnce((_sql, params, cb) => {
      expect(params).toEqual(['paid']);
      cb(null, { total: 1 });
    });
    db.all.mockImplementationOnce((_sql, _params, cb) => cb(new Error('list')));
    payments.getAllPayments({ query: { status: 'paid', page: '-1', limit: '500' } }, listFail);
    expect(listFail.statusCode).toBe(500);
  });

  test('debts and user notifications handle database errors', () => {
    const debtFail = response();
    db.all.mockImplementationOnce((_sql, _params, cb) => cb(new Error('debts')));
    payments.getDebts({}, debtFail);
    expect(debtFail.statusCode).toBe(500);

    const notificationFail = response();
    db.all.mockImplementationOnce((_sql, _params, cb) => cb(new Error('notifications')));
    payments.getUserNotifications({ user: { id: 4 } }, notificationFail);
    expect(notificationFail.statusCode).toBe(500);
  });

  test('create payment handles insert and fetch failures', () => {
    const insertFail = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb(new Error('insert')));
    payments.createPayment({ body: { member_id: 1, amount: 100 } }, insertFail);
    expect(insertFail.statusCode).toBe(500);

    const fetchFail = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ lastID: 8 }, null));
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('fetch')));
    payments.createPayment({ body: { member_id: 1, amount: 100, paid_amount: 50 } }, fetchFail);
    expect(fetchFail.statusCode).toBe(500);

    const missingRow = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ lastID: 8 }, null));
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    payments.createPayment({ body: { member_id: 1, amount: 100 } }, missingRow);
    expect(missingRow.statusCode).toBe(500);
  });

  test('pay debt handles lookup, update and reload failures plus partial result', () => {
    const lookupError = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('lookup')));
    payments.payDebt({ params: { id: 1 }, body: { paid_amount: 10 } }, lookupError);
    expect(lookupError.statusCode).toBe(404);

    const updateError = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { paid_amount: 10, debt_amount: 100, note: 'old' }));
    db.run.mockImplementationOnce((_sql, _params, cb) => cb(new Error('update')));
    payments.payDebt({ params: { id: 1 }, body: { paid_amount: 20 } }, updateError);
    expect(updateError.statusCode).toBe(500);

    const reloadMissing = response();
    db.get
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { paid_amount: 10, debt_amount: 100, note: 'old' }))
      .mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    db.run.mockImplementationOnce((_sql, _params, cb) => cb(null));
    payments.payDebt({ params: { id: 1 }, body: { paid_amount: 20, note: '' } }, reloadMissing);
    expect(reloadMissing.statusCode).toBe(500);
  });

  test('confirm payment handles missing payment, invalid request and update error', () => {
    const missing = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    payments.confirmPayment({ params: { id: 1 }, user: { id: 1 } }, missing);
    expect(missing.statusCode).toBe(404);

    const requestError = response();
    db.get
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1 }))
      .mockImplementationOnce((_sql, _params, cb) => cb(new Error('request')));
    payments.confirmPayment({ params: { id: 1 }, user: { id: 1 } }, requestError);
    expect(requestError.statusCode).toBe(400);

    const noProof = response();
    db.get
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1 }))
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { status: 'pending', proof_image: '' }));
    payments.confirmPayment({ params: { id: 1 }, user: { id: 1 } }, noProof);
    expect(noProof.statusCode).toBe(400);

    const updateError = response();
    db.get
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1 }))
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { status: 'pending', proof_image: 'data:image/png;base64,a' }));
    db.run.mockImplementationOnce((_sql, _params, cb) => cb(new Error('update')));
    payments.confirmPayment({ params: { id: 1 }, user: { id: 1 } }, updateError);
    expect(updateError.statusCode).toBe(500);
  });

  test('reject payment covers lookup error and default notification text', () => {
    const fail = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('lookup')));
    payments.rejectPayment({ params: { id: 1 }, body: {}, user: { id: 1 } }, fail);
    expect(fail.statusCode).toBe(404);

    const ok = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1, plan_name: null, membership_id: 2, user_id: 4 }));
    db.run.mockImplementation((_sql, _params, cb) => cb?.(null));
    payments.rejectPayment({ params: { id: 1 }, body: {}, user: { id: 1 } }, ok);
    expect(ok.statusCode).toBe(200);
  });

  test('user notifications counts falsy read flags', () => {
    const ok = response();
    db.all.mockImplementationOnce((_sql, _params, cb) => cb(null, [{ is_read: 0 }, { is_read: 1 }]));
    payments.getUserNotifications({ user: { id: 4 } }, ok);
    expect(ok.payload.data.unread_count).toBe(1);
  });
});

describe('Consultation controller defensive branches', () => {
  const consultations = require('../src/modules/consultations/consultationController');

  test('create consultation rejects invalid email and insert errors', () => {
    const invalid = response();
    consultations.createConsultation({ body: { full_name: 'A', phone: '1', email: 'bad', interested_product: 'Gym' } }, invalid);
    expect(invalid.statusCode).toBe(400);

    const insertFail = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb(new Error('insert')));
    consultations.createConsultation({ body: { full_name: ' A ', phone: ' 1 ', email: ' A@B.COM ', interested_product: ' Gym ' } }, insertFail);
    expect(insertFail.statusCode).toBe(500);
  });

  test('list and update consultation handle query/update/reload failures and not found', () => {
    const listFail = response();
    db.all.mockImplementationOnce((_sql, _params, cb) => cb(new Error('list')));
    consultations.getAllConsultations({}, listFail);
    expect(listFail.statusCode).toBe(500);

    const updateFail = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ changes: 1 }, new Error('update')));
    consultations.updateConsultationStatus({ params: { id: 1 }, body: { status: 'CONTACTED' } }, updateFail);
    expect(updateFail.statusCode).toBe(500);

    const missing = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ changes: 0 }, null));
    consultations.updateConsultationStatus({ params: { id: 1 }, body: { status: 'CONTACTED' } }, missing);
    expect(missing.statusCode).toBe(404);

    const reloadFail = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ changes: 1 }, null));
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('reload')));
    consultations.updateConsultationStatus({ params: { id: 1 }, body: { status: 'CLOSED' } }, reloadFail);
    expect(reloadFail.statusCode).toBe(500);
  });
});

describe('Plan and class controller defensive branches', () => {
  const plans = require('../src/modules/plans/planController');
  const classes = require('../src/modules/classes/classController');

  test('plan queries and writes expose database failures and not-found results', () => {
    const listFail = response();
    db.all.mockImplementationOnce((_sql, _params, cb) => cb(new Error('list')));
    plans.getAllPlans({}, listFail);
    expect(listFail.statusCode).toBe(500);

    const getFail = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('get')));
    plans.getPlanById({ params: { id: 1 } }, getFail);
    expect(getFail.statusCode).toBe(500);

    const createFail = response();
    db.run.mockImplementationOnce((_sql, params, cb) => {
      expect(params[1]).toBeNull();
      expect(params[4]).toBeNull();
      cb(new Error('create'));
    });
    plans.createPlan({ body: { name: 'Plan', plan_type: 'basic', duration_days: 30, price: 0 } }, createFail);
    expect(createFail.statusCode).toBe(500);

    const updateFail = response();
    db.run.mockImplementationOnce((_sql, params, cb) => {
      expect(params.slice(0, 7)).toEqual([null, null, null, null, null, null, null]);
      cb.call({ changes: 1 }, new Error('update'));
    });
    plans.updatePlan({ params: { id: 1 }, body: {} }, updateFail);
    expect(updateFail.statusCode).toBe(500);

    const updateMissing = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ changes: 0 }, null));
    plans.updatePlan({ params: { id: 999 } , body: { price: 0 } }, updateMissing);
    expect(updateMissing.statusCode).toBe(404);

    const deleteFail = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ changes: 1 }, new Error('delete')));
    plans.deletePlan({ params: { id: 1 } }, deleteFail);
    expect(deleteFail.statusCode).toBe(500);

    const deleteMissing = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ changes: 0 }, null));
    plans.deletePlan({ params: { id: 999 } }, deleteMissing);
    expect(deleteMissing.statusCode).toBe(404);
  });

  test('class queries and writes expose database failures and not-found results', () => {
    const listFail = response();
    db.all.mockImplementationOnce((_sql, _params, cb) => cb(new Error('list')));
    classes.getAllClasses({}, listFail);
    expect(listFail.statusCode).toBe(500);

    const createFail = response();
    db.run.mockImplementationOnce((_sql, params, cb) => {
      expect(params[2]).toBeNull();
      expect(params[3]).toBeNull();
      cb(new Error('create'));
    });
    classes.createClass({ body: { name: 'Yoga', class_type: 'Yoga', start_time: '2026-08-01', end_time: '2026-08-01' } }, createFail);
    expect(createFail.statusCode).toBe(500);

    const updateFail = response();
    db.run.mockImplementationOnce((_sql, params, cb) => {
      expect(params.slice(0, 8)).toEqual([null, null, null, null, null, null, null, null]);
      cb.call({ changes: 1 }, new Error('update'));
    });
    classes.updateClass({ params: { id: 1 }, body: {} }, updateFail);
    expect(updateFail.statusCode).toBe(500);

    const updateMissing = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ changes: 0 }, null));
    classes.updateClass({ params: { id: 999 }, body: {} }, updateMissing);
    expect(updateMissing.statusCode).toBe(404);

    const deleteFail = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ changes: 1 }, new Error('delete')));
    classes.deleteClass({ params: { id: 1 } }, deleteFail);
    expect(deleteFail.statusCode).toBe(500);

    const deleteMissing = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ changes: 0 }, null));
    classes.deleteClass({ params: { id: 999 } }, deleteMissing);
    expect(deleteMissing.statusCode).toBe(404);
  });
});

describe('Check-in controller defensive branches', () => {
  const checkins = require('../src/modules/checkins/checkinController');

  test('list and membership validation handle errors and invalid states', () => {
    const listFail = response();
    db.all.mockImplementationOnce((_sql, _params, cb) => cb(new Error('list')));
    checkins.getAllCheckins({}, listFail);
    expect(listFail.statusCode).toBe(500);

    const lookupFail = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('membership')));
    checkins.createCheckin({ body: { member_id: 1 } }, lookupFail);
    expect(lookupFail.statusCode).toBe(500);

    const missing = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    checkins.createCheckin({ body: { member_id: 1 } }, missing);
    expect(missing.statusCode).toBe(400);

    const exhausted = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1, remaining_sessions: 0 }));
    checkins.createCheckin({ body: { member_id: 1 } }, exhausted);
    expect(exhausted.statusCode).toBe(400);
  });

  test('insert failure and unlimited membership success are handled', () => {
    const insertFail = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1, remaining_sessions: 3 }));
    db.run.mockImplementationOnce((_sql, _params, cb) => cb(new Error('insert')));
    checkins.createCheckin({ body: { member_id: 1 } }, insertFail);
    expect(insertFail.statusCode).toBe(500);
    db.run.mockClear();

    const unlimited = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1, remaining_sessions: null }));
    db.run.mockImplementationOnce((_sql, params, cb) => {
      expect(params[3]).toBe('Check-in thành công');
      cb.call({ lastID: 5 }, null);
    });
    checkins.createCheckin({ body: { member_id: 1 } }, unlimited);
    expect(unlimited.statusCode).toBe(201);
    expect(unlimited.payload.data.membership.remaining_sessions_after).toBeNull();
    expect(db.run).toHaveBeenCalledTimes(1);
  });
});

describe('Booking controller defensive branches', () => {
  const bookings = require('../src/modules/bookings/bookingController');
  const baseClass = { id: 1, status: 'scheduled', booked_count: 0, capacity: 10 };
  const adminRequest = (body = {}) => ({ body: { member_id: 1, class_id: 1, ...body }, user: { id: 1, role: 'admin' } });

  test('list, member resolution and admin validation errors are returned', () => {
    const listFail = response();
    db.all.mockImplementationOnce((_sql, _params, cb) => cb(new Error('list')));
    bookings.getAllBookings({}, listFail);
    expect(listFail.statusCode).toBe(500);

    const memberLookupFail = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('member')));
    bookings.createBooking({ body: { class_id: 1 }, user: { id: 4, role: 'member' } }, memberLookupFail);
    expect(memberLookupFail.statusCode).toBe(500);

    const memberMissing = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    bookings.createBooking({ body: { class_id: 1 }, user: { id: 4, role: 'member' } }, memberMissing);
    expect(memberMissing.statusCode).toBe(404);

    const adminMissing = response();
    bookings.createBooking({ body: { class_id: 1 }, user: { id: 1, role: 'admin' } }, adminMissing);
    expect(adminMissing.statusCode).toBe(400);
  });

  test('membership and class validation errors are returned', () => {
    const membershipError = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('membership')));
    bookings.createBooking(adminRequest(), membershipError);
    expect(membershipError.statusCode).toBe(500);

    const membershipMissing = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    bookings.createBooking(adminRequest(), membershipMissing);
    expect(membershipMissing.statusCode).toBe(400);

    const classError = response();
    db.get
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1 }))
      .mockImplementationOnce((_sql, _params, cb) => cb(new Error('class')));
    bookings.createBooking(adminRequest(), classError);
    expect(classError.statusCode).toBe(500);

    const classMissing = response();
    db.get
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1 }))
      .mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    bookings.createBooking(adminRequest(), classMissing);
    expect(classMissing.statusCode).toBe(404);

    const classClosed = response();
    db.get
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1 }))
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { ...baseClass, status: 'cancelled' }));
    bookings.createBooking(adminRequest(), classClosed);
    expect(classClosed.statusCode).toBe(404);

    const full = response();
    db.get
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1 }))
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { ...baseClass, booked_count: 10 }));
    bookings.createBooking(adminRequest(), full);
    expect(full.statusCode).toBe(400);
  });

  test('duplicate lookup and insert errors are returned', () => {
    const existingError = response();
    db.get
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1 }))
      .mockImplementationOnce((_sql, _params, cb) => cb(null, baseClass))
      .mockImplementationOnce((_sql, _params, cb) => cb(new Error('existing')));
    bookings.createBooking(adminRequest(), existingError);
    expect(existingError.statusCode).toBe(500);

    const duplicate = response();
    db.get
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1 }))
      .mockImplementationOnce((_sql, _params, cb) => cb(null, baseClass))
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 8 }));
    bookings.createBooking(adminRequest(), duplicate);
    expect(duplicate.statusCode).toBe(409);

    const insertError = response();
    db.get
      .mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1 }))
      .mockImplementationOnce((_sql, _params, cb) => cb(null, baseClass))
      .mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    db.run.mockImplementationOnce((_sql, _params, cb) => cb(new Error('insert')));
    bookings.createBooking(adminRequest({ note: '' }), insertError);
    expect(insertError.statusCode).toBe(500);
  });

  test('status update handles database error and missing row', () => {
    const updateError = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ changes: 1 }, new Error('update')));
    bookings.updateBookingStatus({ params: { id: 1 }, body: { status: 'completed' } }, updateError);
    expect(updateError.statusCode).toBe(500);

    const missing = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ changes: 0 }, null));
    bookings.updateBookingStatus({ params: { id: 999 }, body: { status: 'cancelled', note: '' } }, missing);
    expect(missing.statusCode).toBe(404);
  });
});

describe('Membership controller defensive branches', () => {
  const memberships = require('../src/modules/memberships/membershipController');

  test('list and detail queries handle errors and missing rows', () => {
    const listFail = response();
    db.all.mockImplementationOnce((_sql, _params, cb) => cb(new Error('list')));
    memberships.getAllMemberships({}, listFail);
    expect(listFail.statusCode).toBe(500);

    const detailFail = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('detail')));
    memberships.getMembershipById({ params: { id: 1 } }, detailFail);
    expect(detailFail.statusCode).toBe(500);

    const missing = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    memberships.getMembershipById({ params: { id: 999 } }, missing);
    expect(missing.statusCode).toBe(404);

    const actionFail = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1 }));
    db.all.mockImplementationOnce((_sql, _params, cb) => cb(new Error('actions')));
    memberships.getMembershipById({ params: { id: 1 } }, actionFail);
    expect(actionFail.statusCode).toBe(500);
  });

  test('create membership handles plan, membership and payment errors', () => {
    const planFail = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('plan')));
    memberships.createMembership({ body: { member_id: 1, plan_id: 1, start_date: '2026-07-15' } }, planFail);
    expect(planFail.statusCode).toBe(500);

    const planMissing = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    memberships.createMembership({ body: { member_id: 1, plan_id: 1, start_date: '2026-07-15' } }, planMissing);
    expect(planMissing.statusCode).toBe(404);

    const membershipFail = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1, duration_days: 30, session_limit: 0, price: 100 }));
    db.run.mockImplementationOnce((_sql, _params, cb) => cb(new Error('membership')));
    memberships.createMembership({ body: { member_id: 1, plan_id: 1, start_date: '2026-07-15' } }, membershipFail);
    expect(membershipFail.statusCode).toBe(500);

    const paymentFail = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, { id: 1, duration_days: 30, session_limit: null, price: 100 }));
    db.run
      .mockImplementationOnce((_sql, _params, cb) => cb.call({ lastID: 7 }, null))
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce((_sql, _params, cb) => cb(new Error('payment')));
    memberships.createMembership({ body: { member_id: 1, plan_id: 1, start_date: '2026-07-15', paid_amount: 0 } }, paymentFail);
    expect(paymentFail.statusCode).toBe(500);
  });

  test('renew handles lookup alternatives and update failure', () => {
    const lookupError = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(new Error('lookup')));
    memberships.renewMembership({ params: { id: 1 }, body: { extra_days: 30 } }, lookupError);
    expect(lookupError.statusCode).toBe(404);

    const missing = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, undefined));
    memberships.renewMembership({ params: { id: 1 }, body: { extra_days: 30 } }, missing);
    expect(missing.statusCode).toBe(404);

    const updateFail = response();
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, {
      id: 1, member_id: 1, end_date: '2026-08-01', price: 100,
    }));
    db.run.mockImplementationOnce((_sql, _params, cb) => cb(new Error('update')));
    memberships.renewMembership({ params: { id: 1 }, body: { extra_days: 30, paid_amount: 0 } }, updateFail);
    expect(updateFail.statusCode).toBe(500);
  });

  test.each([
    ['freezeMembership', 'Không thể bảo lưu gói'],
    ['unfreezeMembership', 'Không thể kích hoạt lại gói'],
    ['cancelMembership', 'Không thể hủy gói'],
  ])('%s handles update error and missing row', (methodName, message) => {
    const method = memberships[methodName];
    const fail = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ changes: 1 }, new Error('update')));
    method({ params: { id: 1 }, body: {} }, fail);
    expect(fail.statusCode).toBe(500);
    expect(fail.payload.message).toBe(message);

    const missing = response();
    db.run.mockImplementationOnce((_sql, _params, cb) => cb.call({ changes: 0 }, null));
    method({ params: { id: 999 }, body: {} }, missing);
    expect(missing.statusCode).toBe(404);
  });
});
