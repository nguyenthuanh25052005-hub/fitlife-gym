const express = require('express');

const {
  getAllBookings,
  createBooking,
  updateBookingStatus
} = require('./bookingController');

const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'trainer'), getAllBookings);
router.post('/', authorize('admin', 'member'), createBooking);
router.put('/:id/status', authorize('admin', 'trainer'), updateBookingStatus);

module.exports = router;