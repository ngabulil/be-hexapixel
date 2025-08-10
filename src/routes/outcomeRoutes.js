const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const uploadTo = require('../middleware/uploadMiddleware'); // sesuaikan path utils-mu

const {
  createOutcome,
  getOutcomes,
  getOutcomeById,
  updateOutcome,
  deleteOutcome,
  exportOutcomesByMonth
} = require('../controllers/outcomeControllers');

// semua route outcome butuh login
router.use(auth);

// CREATE outcome (upload ke folder 'outcomes')
router.post('/', uploadTo('receipts').single('receipt'), createOutcome);

// GET all outcomes
router.get('/', getOutcomes);

// EXPORT outcomes by monthType (currMonth / prevMonth)
// taruh di atas route :id supaya tidak bentrok
router.get('/export/:monthType', exportOutcomesByMonth);

// GET outcome by ID
router.get('/:id', getOutcomeById);

// UPDATE outcome
router.put('/:id', uploadTo('receipts').single('receipt'), updateOutcome);

// DELETE outcome
router.delete('/:id', deleteOutcome);

module.exports = router;
