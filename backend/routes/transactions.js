const express = require('express');
const {
  getTransactions,
  getMyTransactions,
  depositFunds,
  createPayment,
  releasePayment,
  getWalletBalance
} = require('../controllers/transactions');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, authorize('admin'), getTransactions);

router.route('/my-transactions').get(protect, getMyTransactions);
router.route('/wallet').get(protect, getWalletBalance);
router.route('/deposit').post(protect, authorize('employer'), depositFunds);
router.route('/payment').post(protect, authorize('employer'), createPayment);
router.route('/:id/release').put(protect, authorize('employer'), releasePayment);

module.exports = router;