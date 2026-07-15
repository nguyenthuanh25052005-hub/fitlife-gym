const express = require('express');

const {
  getDashboard
} = require('./reportController');

const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/roleMiddleware');

const router = express.Router();

router.get(
  '/dashboard',
  authenticate,
  authorize('admin'),
  getDashboard
);

module.exports = router;
