describe("Report Dashboard - PostgreSQL branch", () => {
  const originalDbClient = process.env.DB_CLIENT;

  beforeEach(() => {
    jest.resetModules();
    process.env.DB_CLIENT = "postgres";
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    if (originalDbClient === undefined) {
      delete process.env.DB_CLIENT;
    } else {
      process.env.DB_CLIENT = originalDbClient;
    }
  });

  test("returns safe default values when dashboard queries return empty data", async () => {
  const mockDb = {
    get: jest.fn((sql, params, callback) => {
      callback(null, undefined);
    }),

    all: jest.fn((sql, params, callback) => {
      callback(null, undefined);
    }),
  };

  jest.doMock("../src/database/db", () => mockDb);

  const { getDashboard } = require(
    "../src/modules/reports/reportController",
  );

  const req = {};

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  await getDashboard(req, res);

  expect(res.status).toHaveBeenCalledWith(200);

  expect(res.json).toHaveBeenCalledWith({
    success: true,
    data: {
      overview: {
        total_members: 0,
        active_members: 0,
        active_trainers: 0,
        active_memberships: 0,
      },
      finance: {
        total_revenue: 0,
        total_debt: 0,
      },
      operations: {
        today_checkins: 0,
        pending_bookings: 0,
      },
      alerts: {
        expiring_memberships: [],
      },
      schedule: {
        upcoming_classes: [],
      },
    },
  });
});

  test("returns dashboard data using PostgreSQL-compatible queries", async () => {
    const mockDb = {
      get: jest.fn((sql, params, callback) => {
        let row;

        if (
          sql.includes("SUM(paid_amount)") &&
          sql.includes("SUM(debt_amount)")
        ) {
          row = {
            total_revenue: "4000000",
            total_debt: "1000000",
          };
        } else if (sql.includes("FROM checkins")) {
          row = { total: "3" };
        } else if (sql.includes("FROM bookings")) {
          row = { total: "2" };
        } else if (sql.includes("FROM trainers")) {
          row = { total: "2" };
        } else if (sql.includes("FROM memberships")) {
          row = { total: "4" };
        } else if (
          sql.includes("FROM members") &&
          sql.includes("status = 'active'")
        ) {
          row = { total: "5" };
        } else if (sql.includes("FROM members")) {
          row = { total: "5" };
        } else {
          row = { total: "0" };
        }

        callback(null, row);
      }),

      all: jest.fn((sql, params, callback) => {
        if (sql.includes("FROM memberships")) {
          callback(null, [
            {
              id: 1,
              member_code: "MB001",
              full_name: "Nguyen Van A",
              plan_name: "Premium",
              end_date: "2026-07-30",
              days_remaining: 15,
            },
          ]);
          return;
        }

        if (sql.includes("FROM classes")) {
          callback(null, [
            {
              id: 1,
              name: "Yoga Morning",
              class_type: "yoga",
              room: "Studio A",
              start_time: "2026-07-20T08:00:00",
              end_time: "2026-07-20T09:00:00",
              trainer_name: "Trainer A",
              booked_count: "3",
              capacity: 20,
            },
          ]);
          return;
        }

        callback(null, []);
      }),
    };

    jest.doMock("../src/database/db", () => mockDb);

    const { getDashboard } = require(
      "../src/modules/reports/reportController",
    );

    const req = {};

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await getDashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          overview: {
            total_members: 5,
            active_members: 5,
            active_trainers: 2,
            active_memberships: 4,
          },
          finance: {
            total_revenue: 4000000,
            total_debt: 1000000,
          },
          operations: {
            today_checkins: 3,
            pending_bookings: 2,
          },
        }),
      }),
    );

    const executedGetSql = mockDb.get.mock.calls
      .map((call) => call[0])
      .join("\n");

    const executedAllSql = mockDb.all.mock.calls
      .map((call) => call[0])
      .join("\n");

    expect(executedGetSql).toContain("CURRENT_DATE");
    expect(executedAllSql).toContain("CURRENT_TIMESTAMP");
    expect(executedAllSql).toContain("users.full_name");
  });

  test("returns 500 when PostgreSQL query fails", async () => {
    const mockDb = {
      get: jest.fn((sql, params, callback) => {
        callback(new Error("PostgreSQL query failed"));
      }),

      all: jest.fn(),
    };

    jest.doMock("../src/database/db", () => mockDb);

    const { getDashboard } = require(
      "../src/modules/reports/reportController",
    );

    const req = {};

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await getDashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Không thể tải dữ liệu dashboard",
    });

    consoleSpy.mockRestore();
  });
});