const express = require('express');

const {
  getAllMemberships,
  getMembershipById,
  createMembership,
  renewMembership,
  freezeMembership,
  unfreezeMembership,
  cancelMembership
} = require('./membershipController');

const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'trainer'), getAllMemberships);
router.get('/:id', authorize('admin', 'trainer'), getMembershipById);
router.post('/', authorize('admin'), createMembership);
router.put('/:id/renew', authorize('admin'), renewMembership);
router.put('/:id/freeze', authorize('admin'), freezeMembership);
router.put('/:id/unfreeze', authorize('admin'), unfreezeMembership);
router.put('/:id/cancel', authorize('admin'), cancelMembership);

module.exports = router;