const db = require("../../database/db");

const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
};

const runAllQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
};

const isPostgres = ["postgres", "postgresql"].includes(
  String(process.env.DB_CLIENT || "sqlite").toLowerCase(),
);

const getDashboard = async (req, res) => {
  try {
    /* istanbul ignore next -- PostgreSQL branch is verified by Docker integration and k6 */
    const todayCheckinsSql = isPostgres
      ? `
          SELECT COUNT(*) AS total
          FROM checkins
          WHERE checkin_time::date = CURRENT_DATE
            AND status = 'valid'
        `
      : `
          SELECT COUNT(*) AS total
          FROM checkins
          WHERE DATE(checkin_time) = DATE('now', 'localtime')
            AND status = 'valid'
        `;

    /* istanbul ignore next -- PostgreSQL branch is verified by Docker integration and k6 */
    const expiringMembershipsSql = isPostgres
      ? `
          SELECT
            memberships.id,
            members.member_code,
            users.full_name,
            plans.name AS plan_name,
            memberships.end_date,
            memberships.end_date::date - CURRENT_DATE AS days_remaining
          FROM memberships
          JOIN members
            ON memberships.member_id = members.id
          JOIN users
            ON members.user_id = users.id
          JOIN plans
            ON memberships.plan_id = plans.id
          WHERE memberships.status = 'active'
            AND memberships.end_date::date
              BETWEEN CURRENT_DATE
              AND CURRENT_DATE + 30
          ORDER BY memberships.end_date ASC
          LIMIT 5
        `
      : `
          SELECT
            memberships.id,
            members.member_code,
            users.full_name,
            plans.name AS plan_name,
            memberships.end_date,
            CAST(
              JULIANDAY(memberships.end_date) -
              JULIANDAY(DATE('now', 'localtime'))
              AS INTEGER
            ) AS days_remaining
          FROM memberships
          JOIN members
            ON memberships.member_id = members.id
          JOIN users
            ON members.user_id = users.id
          JOIN plans
            ON memberships.plan_id = plans.id
          WHERE memberships.status = 'active'
            AND DATE(memberships.end_date)
              BETWEEN DATE('now', 'localtime')
              AND DATE('now', 'localtime', '+30 days')
          ORDER BY memberships.end_date ASC
          LIMIT 5
        `;

    /* istanbul ignore next -- PostgreSQL branch is verified by Docker integration and k6 */
    const upcomingClassesSql = isPostgres
      ? `
          SELECT
            classes.id,
            classes.name,
            classes.class_type,
            classes.room,
            classes.start_time,
            classes.end_time,
            users.full_name AS trainer_name,
            COUNT(bookings.id) AS booked_count,
            classes.capacity
          FROM classes
          LEFT JOIN trainers
            ON classes.trainer_id = trainers.id
          LEFT JOIN users
            ON trainers.user_id = users.id
          LEFT JOIN bookings
            ON classes.id = bookings.class_id
            AND bookings.status = 'booked'
          WHERE classes.status = 'scheduled'
            AND classes.start_time::timestamp >= CURRENT_TIMESTAMP
          GROUP BY
            classes.id,
            classes.name,
            classes.class_type,
            classes.room,
            classes.start_time,
            classes.end_time,
            users.full_name,
            classes.capacity
          ORDER BY classes.start_time ASC
          LIMIT 5
        `
      : `
          SELECT
            classes.id,
            classes.name,
            classes.class_type,
            classes.room,
            classes.start_time,
            classes.end_time,
            users.full_name AS trainer_name,
            COUNT(bookings.id) AS booked_count,
            classes.capacity
          FROM classes
          LEFT JOIN trainers
            ON classes.trainer_id = trainers.id
          LEFT JOIN users
            ON trainers.user_id = users.id
          LEFT JOIN bookings
            ON classes.id = bookings.class_id
            AND bookings.status = 'booked'
          WHERE classes.status = 'scheduled'
            AND DATETIME(classes.start_time)
              >= DATETIME('now', 'localtime')
          GROUP BY classes.id
          ORDER BY classes.start_time ASC
          LIMIT 5
        `;

    const [
      totalMembers,
      activeMembers,
      totalTrainers,
      activeMemberships,
      finance,
      todayCheckins,
      pendingBookings,
      expiringMemberships,
      upcomingClasses,
    ] = await Promise.all([
      runQuery(`
        SELECT COUNT(*) AS total
        FROM members
      `),

      runQuery(`
        SELECT COUNT(*) AS total
        FROM members
        WHERE status = 'active'
      `),

      runQuery(`
        SELECT COUNT(*) AS total
        FROM trainers
        WHERE status = 'active'
      `),

      runQuery(`
        SELECT COUNT(*) AS total
        FROM memberships
        WHERE status = 'active'
      `),

      runQuery(`
        SELECT
          COALESCE(SUM(paid_amount), 0) AS total_revenue,
          COALESCE(SUM(debt_amount), 0) AS total_debt
        FROM payments
      `),

      runQuery(todayCheckinsSql),

      runQuery(`
        SELECT COUNT(*) AS total
        FROM bookings
        WHERE status = 'booked'
      `),

      runAllQuery(expiringMembershipsSql),
      runAllQuery(upcomingClassesSql),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          total_members: Number(totalMembers?.total || 0),
          active_members: Number(activeMembers?.total || 0),
          active_trainers: Number(totalTrainers?.total || 0),
          active_memberships: Number(activeMemberships?.total || 0),
        },
        finance: {
          total_revenue: Number(finance?.total_revenue || 0),
          total_debt: Number(finance?.total_debt || 0),
        },
        operations: {
          today_checkins: Number(todayCheckins?.total || 0),
          pending_bookings: Number(pendingBookings?.total || 0),
        },
        alerts: {
          expiring_memberships: expiringMemberships || [],
        },
        schedule: {
          upcoming_classes: upcomingClasses || [],
        },
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể tải dữ liệu dashboard",
    });
  }
};

module.exports = {
  getDashboard,
};
