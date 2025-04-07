const express = require('express');
const {
  getReviews,
  getUserReviews,
  getTaskReviews,
  createReview,
  updateReview,
  deleteReview
} = require('../controllers/reviews');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.route('/')
  .get(getReviews)
  .post(protect, createReview);

router.route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

router.route('/user/:userId')
  .get(getUserReviews);

router.route('/task/:taskId')
  .get(getTaskReviews);

module.exports = router;