const express = require('express');
const router = express.Router();

// Import semua routes
const userRoutes = require('./userRoutes');
const outcomeRoutes = require('./outcomeRoutes');
const itemOutcomeRoutes = require('./itemOutcomeRoutes');
const itemIncomeRoutes = require('./itemIncomeRoutes');
const incomeRoutes = require('./incomeRoutes');
const dashboardRoutes = require('./dashboardRoutes');

// Pasang prefix API
router.use('/users', userRoutes);
router.use('/outcomes', outcomeRoutes);
router.use('/item-outcomes', itemOutcomeRoutes);
router.use('/item-incomes', itemIncomeRoutes);
router.use('/incomes', incomeRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
