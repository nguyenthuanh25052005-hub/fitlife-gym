const express = require('express');

const {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
} = require('./memberController');

const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getAllMembers);
router.get('/:id', getMemberById);
router.post('/', createMember);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);

module.exports = router;