const asyncHandler = require('../utils/asyncHandler');
const Task = require('../models/Task');
const User = require('../models/User');
const Skill = require('../models/Skill');

// @desc    Search tasks
// @route   GET /api/v1/search/tasks
// @access  Public
exports.searchTasks = asyncHandler(async (req, res, next) => {
  const { 
    keyword, 
    status, 
    county, 
    subCounty, 
    skill, 
    minPayment, 
    maxPayment,
    sort = '-createdAt'
  } = req.query;

  // Build query
  const query = {};

  // Search by keyword in title or description
  if (keyword) {
    query.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } }
    ];
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by location
  if (county) {
    query['location.county'] = county;
  }

  if (subCounty) {
    query['location.subCounty'] = subCounty;
  }

  // Filter by skill
  if (skill) {
    const skillDoc = await Skill.findOne({ 
      $or: [
        { _id: skill },
        { name: { $regex: skill, $options: 'i' } }
      ]
    });
    
    if (skillDoc) {
      query.requiredSkills = skillDoc._id;
    }
  }

  // Filter by payment amount
  if (minPayment || maxPayment) {
    query['payment.amount'] = {};
    
    if (minPayment) {
      query['payment.amount'].$gte = Number(minPayment);
    }
    
    if (maxPayment) {
      query['payment.amount'].$lte = Number(maxPayment);
    }
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Task.countDocuments(query);

  // Execute query
  const tasks = await Task.find(query)
    .populate({
      path: 'employer',
      select: 'name location'
    })
    .populate({
      path: 'tasker',
      select: 'name location averageRating'
    })
    .populate('requiredSkills')
    .sort(sort)
    .skip(startIndex)
    .limit(limit);

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: tasks.length,
    pagination,
    total,
    data: tasks
  });
});

// @desc    Search taskers
// @route   GET /api/v1/search/taskers
// @access  Public
exports.searchTaskers = asyncHandler(async (req, res, next) => {
  const { 
    keyword,
    county,
    subCounty,
    skill,
    minRating,
    sort = 'averageRating'
  } = req.query;

  // Build query
  const query = { role: 'tasker' };

  // Search by keyword in name
  if (keyword) {
    query.name = { $regex: keyword, $options: 'i' };
  }

  // Filter by location
  if (county) {
    query['location.county'] = county;
  }

  if (subCounty) {
    query['location.subCounty'] = subCounty;
  }

  // Filter by skill
  if (skill) {
    const skillDoc = await Skill.findOne({ 
      $or: [
        { _id: skill },
        { name: { $regex: skill, $options: 'i' } }
      ]
    });
    
    if (skillDoc) {
      query.skills = skillDoc._id;
    }
  }

  // Filter by rating
  if (minRating) {
    query.averageRating = { $gte: Number(minRating) };
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await User.countDocuments(query);

  // Execute query
  const taskers = await User.find(query)
    .select('-password -resetPasswordToken -resetPasswordExpire')
    .populate('skills')
    .sort(sort)
    .skip(startIndex)
    .limit(limit);

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: taskers.length,
    pagination,
    total,
    data: taskers
  });
});