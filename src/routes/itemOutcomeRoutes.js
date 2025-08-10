const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const {
  createItemOutcome,
  getAllItemOutcomes,
  updateItemOutcome,
  deleteItemOutcome
} = require('../controllers/itemOutcomeControllers');

// Semua route item outcome butuh login
router.use(auth);

// CREATE
router.post('/', createItemOutcome);

// GET ALL
router.get('/', getAllItemOutcomes);

// UPDATE
router.put('/:id', updateItemOutcome);

// DELETE
router.delete('/:id', deleteItemOutcome);

module.exports = router;
