const express = require('express');
const {
  getNotifications,
  markNotificationRead,
  getMemberManagement,
  lockMember,
  unlockMember,
  deleteMemberAccount
} = require('./adminController');

const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.get('/members', getMemberManagement);
router.put('/members/:id/lock', lockMember);
router.put('/members/:id/unlock', unlockMember);
router.delete('/members/:id', deleteMemberAccount);

module.exports = router;