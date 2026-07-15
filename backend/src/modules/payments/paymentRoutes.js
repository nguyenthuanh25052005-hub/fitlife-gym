const express = require('express');

const {
  getAllPayments,
  getDebts,
  createPayment,
  payDebt,
  confirmPayment,
  getUserNotifications,
  rejectPayment
} = require('./paymentController');

const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin'), getAllPayments);
router.get('/debts', authorize('admin'), getDebts);
router.get('/notifications', getUserNotifications);
router.post('/', authorize('admin'), createPayment);
router.put('/:id/pay-debt', authorize('admin'), payDebt);
router.put('/:id/confirm', authorize('admin'), confirmPayment);
router.put('/:id/reject', authorize('admin'), rejectPayment);

module.exports = router;
