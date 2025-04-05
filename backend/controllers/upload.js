const path = require('path');
const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// @desc    Upload profile picture
// @route   PUT /api/v1/upload/profile
// @access  Private
exports.uploadProfilePicture = asyncHandler(async (req, res, next) => {
  // Check if file was uploaded
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Please upload an image file', 400));
  }

  // Check file size
  if (file.size > process.env.MAX_FILE_UPLOAD || file.size > 1000000) { // Default to 1MB if env var not set
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD || '1MB'}`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `photo_${req.user.id}${path.parse(file.name).ext}`;

  // Create uploads folder if it doesn't exist
  const uploadDir = 'public/uploads';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Move file to upload path
  file.mv(`${uploadDir}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Problem with file upload', 500));
    }

    // Update user with profile picture URL
    await User.findByIdAndUpdate(req.user.id, {
      profilePicture: `/uploads/${file.name}`
    });

    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});

// @desc    Upload task image
// @route   PUT /api/v1/upload/task/:id
// @access  Private
exports.uploadTaskImage = asyncHandler(async (req, res, next) => {
  // Find task
  const task = await Task.findById(req.params.id);
  
  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is task employer
  if (task.employer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this task`,
        403
      )
    );
  }

  // Check if file was uploaded
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Please upload an image file', 400));
  }

  // Check file size
  if (file.size > process.env.MAX_FILE_UPLOAD || file.size > 1000000) { // Default to 1MB if env var not set
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD || '1MB'}`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `task_${req.params.id}${path.parse(file.name).ext}`;

  // Create uploads folder if it doesn't exist
  const uploadDir = 'public/uploads';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Move file to upload path
  file.mv(`${uploadDir}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Problem with file upload', 500));
    }

    // Add image to task
    task.images = task.images || [];
    task.images.push(`/uploads/${file.name}`);
    await task.save();

    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});