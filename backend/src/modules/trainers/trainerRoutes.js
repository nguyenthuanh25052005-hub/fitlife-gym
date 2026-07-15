const express = require('express');

const {
  getAllTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  createTrainerNote
} = require('./trainerController');

const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'trainer', 'member'), getAllTrainers);
router.get('/:id', authorize('admin', 'trainer'), getTrainerById);
router.post('/', authorize('admin'), createTrainer);
router.put('/:id', authorize('admin'), updateTrainer);
router.delete('/:id', authorize('admin'), deleteTrainer);
router.post('/notes', authorize('admin', 'trainer'), createTrainerNote);

module.exports = router;