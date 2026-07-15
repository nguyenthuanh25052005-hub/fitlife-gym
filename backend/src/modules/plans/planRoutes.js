const express = require('express');

const {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} = require('./planController');

const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'trainer', 'member'), getAllPlans);
router.get('/:id', authorize('admin', 'trainer', 'member'), getPlanById);
router.post('/', authorize('admin'), createPlan);
router.put('/:id', authorize('admin'), updatePlan);
router.delete('/:id', authorize('admin'), deletePlan);

module.exports = router;