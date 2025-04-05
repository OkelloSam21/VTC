const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Review = require('../models/Review');
const User = require('../models/User');
const Task = require('../models/Task');

// @desc    Get all reviews
// @route   GET /api/v1/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find()
    .populate({
      path: 'reviewer',
      select: 'name'
    })
    .populate({
      path: 'reviewee',
      select: 'name'
    })
    .populate('task', 'title');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get reviews for a specific user
// @route   GET /api/v1/reviews/user/:userId
// @access  Public
exports.getUserReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ reviewee: req.params.userId })
    .populate({
      path: 'reviewer',
      select: 'name'
    })
    .populate({
      path: 'reviewee',
      select: 'name'
    })
    .populate('task', 'title');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get reviews for a specific task
// @route   GET /api/v1/reviews/task/:taskId
// @access  Public
exports.getTaskReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ task: req.params.taskId })
    .populate({
      path: 'reviewer',
      select: 'name'
    })
    .populate({
      path: 'reviewee',
      select: 'name'
    })
    .populate('task', 'title');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Create a review
// @route   POST /api/v1/reviews
// @access  Private
exports.createReview = asyncHandler(async (req, res, next) => {
  const { revieweeId, taskId, rating, comment } = req.body;

  // Validate required fields
  if (!revieweeId || !taskId || !rating) {
    return next(
      new ErrorResponse('Please provide reviewee, task, and rating', 400)
    );
  }

  // Check if task exists and is completed
  const task = await Task.findById(taskId);
  if (!task) {
    return next(new ErrorResponse(`Task not found with id of ${taskId}`, 404));
  }

  if (task.status !== 'completed') {
    return next(
      new ErrorResponse(`Cannot review a task that is not completed`, 400)
    );
  }

  // Check if the reviewer is either the employer or the tasker of the task
  if (
    task.employer.toString() !== req.user.id &&
    task.tasker.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to create a review for this task`,
        403
      )
    );
  }

  // Check if the reviewee is either the employer or the tasker of the task
  if (
    revieweeId !== task.employer.toString() &&
    revieweeId !== task.tasker.toString()
  ) {
    return next(
      new ErrorResponse(
        `The reviewee must be either the employer or the tasker of the task`,
        400
      )
    );
  }

  // Check if the reviewer is not reviewing themselves
  if (revieweeId === req.user.id) {
    return next(
      new ErrorResponse(`A user cannot review themselves`, 400)
    );
  }

  // Check if review already exists for this reviewer, reviewee, and task
  const existingReview = await Review.findOne({
    reviewer: req.user.id,
    reviewee: revieweeId,
    task: taskId
  });

  if (existingReview) {
    return next(
      new ErrorResponse(`You have already reviewed this person for this task`, 400)
    );
  }

  // Create review
  const review = await Review.create({
    reviewer: req.user.id,
    reviewee: revieweeId,
    task: taskId,
    rating,
    comment
  });

  // Update user's average rating
  const reviewee = await User.findById(revieweeId);
  const allReviews = await Review.find({ reviewee: revieweeId });
  
  const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / allReviews.length;
  
  reviewee.averageRating = averageRating;
  await reviewee.save();

  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Update a review
// @route   PUT /api/v1/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`Review not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure review belongs to user
  if (review.reviewer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this review`,
        403
      )
    );
  }

  review = await Review.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  // Update user's average rating
  const reviewee = await User.findById(review.reviewee);
  const allReviews = await Review.find({ reviewee: review.reviewee });
  
  const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / allReviews.length;
  
  reviewee.averageRating = averageRating;
  await reviewee.save();

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Delete a review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`Review not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure review belongs to user or user is admin
  if (review.reviewer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this review`,
        403
      )
    );
  }

  await review.remove();

  // Update user's average rating
  const reviewee = await User.findById(review.reviewee);
  const allReviews = await Review.find({ reviewee: review.reviewee });
  
  let averageRating = 0;
  if (allReviews.length > 0) {
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    averageRating = totalRating / allReviews.length;
  }
  
  reviewee.averageRating = averageRating;
  await reviewee.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});