const express = require('express');
const {
  getCounties,
  getSubCounties,
  getVillages,
  createLocation
} = require('../controllers/locations');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/counties').get(getCounties);
router.route('/county/:county/subcounties').get(getSubCounties);
router
  .route('/county/:county/subcounty/:subcounty/villages')
  .get(getVillages);

router
  .route('/')
  .post(protect, authorize('admin'), createLocation);

module.exports = router;