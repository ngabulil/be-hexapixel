const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const {
    createItemIncome,
    getAllItemIncomes,
    updateItemIncome,
    deleteItemIncome
} = require('../controllers/itemIncomeControllers');

// protect all item-income routes
router.use(auth);

// CREATE
router.post('/', createItemIncome);

// READ (get all)
router.get('/', getAllItemIncomes);

// UPDATE
router.put('/:id', updateItemIncome);

// DELETE
router.delete('/:id', deleteItemIncome);

module.exports = router;
