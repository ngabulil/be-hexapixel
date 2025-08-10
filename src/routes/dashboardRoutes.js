const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const {
  getIncomeSummary,
  getIncomeCountSummary,
  getOutcomeSummary,
  getOutcomeCountSummary,
  getTopItemsOutcomeSummary,
  getTopItemsIncomeSummary,
  getLatestClientIncome,
  getDailySummaryChart
} = require('../controllers/dashboardControllers');

// semua summary perlu login
router.use(auth);

// 📊 Income Summary
router.get('/income/summary/:type', getIncomeSummary);
router.get('/income/count-summary/:type', getIncomeCountSummary);

// 📊 Outcome Summary
router.get('/outcome/summary/:type', getOutcomeSummary);
router.get('/outcome/count-summary/:type', getOutcomeCountSummary);

// 📈 Daily Summary Chart (income / outcome)
router.get('/daily/:type', getDailySummaryChart);

// 🏆 Top Items
router.get('/income/top-items/:type', getTopItemsIncomeSummary);
router.get('/outcome/top-items/:type', getTopItemsOutcomeSummary);

// 🆕 Latest Client Income
router.get('/income/latest-clients', getLatestClientIncome);

module.exports = router;
