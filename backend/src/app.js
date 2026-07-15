require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");

const authRoutes = require("./modules/auth/authRoutes");
const reportRoutes = require("./modules/reports/reportRoutes");
const memberRoutes = require("./modules/members/memberRoutes");
const planRoutes = require("./modules/plans/planRoutes");
const membershipRoutes = require("./modules/memberships/membershipRoutes");
const paymentRoutes = require("./modules/payments/paymentRoutes");
const checkinRoutes = require('./modules/checkins/checkinRoutes');
const classRoutes = require('./modules/classes/classRoutes');
const bookingRoutes = require('./modules/bookings/bookingRoutes');
const trainerRoutes = require('./modules/trainers/trainerRoutes');
const consultationRoutes = require('./modules/consultations/consultationRoutes');
const userRoutes = require('./modules/user/userRoutes');
const adminRoutes = require('./modules/admin/adminRoutes');
const { observabilityMiddleware, metricsHandler } = require('./middleware/observabilityMiddleware');
const app = express();

app.use(cors());
app.use(observabilityMiddleware);
app.use(express.json({ limit: "12mb" }));

app.get("/", (req, res) => {
  res.json({
    message: "FitLife Gym Management API",
    status: "running",
  });
});

app.get("/metrics", metricsHandler);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "FitLife Gym Backend",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/payments", paymentRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
module.exports = app;
