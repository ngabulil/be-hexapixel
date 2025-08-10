const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const {
  createIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome,
  exportIncomeExcel
} = require('../controllers/incomeControllers');

// protect all income routes
router.use(auth);

// EXPORT (currMonth | prevMonth) — taruh sebelum :id
router.get('/export/:type', exportIncomeExcel);

// CREATE
router.post('/', createIncome);

// LIST (pagination & search di controller)
router.get('/', getIncomes);

// DETAIL
router.get('/:id', getIncomeById);

// UPDATE (only super_admin & manager — dicek di controller)
router.put('/:id', updateIncome);

// DELETE (only super_admin & manager — dicek di controller)
router.delete('/:id', deleteIncome);

module.exports = router;
