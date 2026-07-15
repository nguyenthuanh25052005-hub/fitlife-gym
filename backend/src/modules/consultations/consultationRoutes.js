const express = require('express');

const {
  createConsultation,
  getAllConsultations,
  updateConsultationStatus,
} = require('./consultationController');

const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/roleMiddleware');

const router = express.Router();

router.post('/', createConsultation);
router.get('/', authenticate, authorize('admin'), getAllConsultations);
router.put('/:id/status', authenticate, authorize('admin'), updateConsultationStatus);

module.exports = router;
