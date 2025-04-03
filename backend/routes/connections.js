const express = require('express');
const {
  getConnections,
  getConnection,
  getMyConnections,
  createConnection,
  acceptConnection,
  rejectConnection,
  completeConnection
} = require('../controllers/connections');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, authorize('admin'), getConnections)
  .post(protect, createConnection);

router.route('/my-connections').get(protect, getMyConnections);

router.route('/:id').get(protect, getConnection);

router.route('/:id/accept').put(protect, acceptConnection);
router.route('/:id/reject').put(protect, rejectConnection);
router.route('/:id/complete').put(protect, completeConnection);

module.exports = router;