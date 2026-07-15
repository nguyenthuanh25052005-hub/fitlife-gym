const express = require('express');
const {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getMyBodyMetrics,
  updateBodyMetrics,
  getMyMemberships,
  buyPlan,
  cancelMyMembership,
  upgradeMembership,
  getMyCoach,
  changeCoach,
  getMyBookings,
  bookClass,
  cancelBooking,
  getUserDashboard,
  createPaymentQR,
  getHealthAdvice,
  submitPaymentConfirmation,
  cancelPaymentConfirmation,
  markMyNotificationRead
} = require('./userController');

const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize('member'));

// Dashboard
router.get('/dashboard', getUserDashboard);

// Profile
router.get('/profile', getMyProfile);
router.put('/profile', updateMyProfile);
router.put('/change-password', changePassword);

// Body Metrics
router.get('/body-metrics', getMyBodyMetrics);
router.put('/body-metrics', updateBodyMetrics);
router.get('/health-advice', getHealthAdvice);

// Memberships
router.get('/memberships', getMyMemberships);
router.post('/buy-plan', buyPlan);
router.put('/memberships/:id/cancel', cancelMyMembership);
router.put('/memberships/:id/upgrade', upgradeMembership);

// Coach
router.get('/coach', getMyCoach);
router.put('/coach', changeCoach);

// Bookings
router.get('/bookings', getMyBookings);
router.post('/book-class', bookClass);
router.put('/bookings/:id/cancel', cancelBooking);

// Payment
router.post('/create-qr', createPaymentQR);
router.post('/payment-confirmation', submitPaymentConfirmation);
router.put('/payment-confirmation/:membershipId/cancel', cancelPaymentConfirmation);
router.put('/notifications/:id/read', markMyNotificationRead);

module.exports = router;