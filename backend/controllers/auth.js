const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, phoneNumber, nationalId, password, role, location } = req.body;

  // Create user
  const user = await User.create({
    name,
    phoneNumber,
    nationalId,
    password,
    role,
    location
  });

  // If user is a tasker, add education and skills
  if (role === 'tasker' && req.body.education) {
    user.education = req.body.education;
    await user.save();
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Register tasker with skills
// @route   POST /api/v1/auth/register/tasker
// @access  Public
exports.registerTasker = asyncHandler(async (req, res, next) => {
  const { 
    name, 
    phoneNumber, 
    nationalId, 
    password, 
    location, 
    education,
    skills 
  } = req.body;

  // Create user with tasker role
  const user = await User.create({
    name,
    phoneNumber,
    nationalId,
    password,
    role: 'tasker',
    location,
    education,
    skills
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { phoneNumber, password } = req.body;

  // Validate phone & password
  if (!phoneNumber || !password) {
    return next(new ErrorResponse('Please provide phone number and password', 400));
  }

  // Check for user
  const user = await User.findOne({ phoneNumber }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    phoneNumber: req.body.phoneNumber,
    location: req.body.location
  };

  // If user is a tasker, allow updating education
  if (req.user.role === 'tasker' && req.body.education) {
    fieldsToUpdate.education = req.body.education;
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = getSignedJwtToken(user);

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};

// Helper function to sign JWT
const getSignedJwtToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};