const express = require('express');

const {
  getAllCheckins,
  createCheckin
} = require('./checkinController');

const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'trainer'), getAllCheckins);
router.post('/', authorize('admin'), createCheckin);

module.exports = router;