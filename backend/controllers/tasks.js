const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get all tasks
// @route   GET /api/v1/tasks
// @access  Public
exports.getTasks = asyncHandler(async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Finding resource
  query = Task.find(JSON.parse(queryStr))
    .populate({
      path: 'employer',
      select: 'name location'
    })
    .populate({
      path: 'tasker',
      select: 'name location averageRating'
    })
    .populate('requiredSkills');

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Task.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const tasks = await query;

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
    data: tasks
  });
});

// @desc    Get single task
// @route   GET /api/v1/tasks/:id
// @access  Public
exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate({
      path: 'employer',
      select: 'name location'
    })
    .populate({
      path: 'tasker',
      select: 'name location averageRating'
    })
    .populate('requiredSkills');

  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Create new task
// @route   POST /api/v1/tasks
// @access  Private/Employer
exports.createTask = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.employer = req.user.id;

  // Check if user is an employer
  if (req.user.role !== 'employer') {
    return next(
      new ErrorResponse(
        `User with ID ${req.user.id} is not authorized to create a task`,
        403
      )
    );
  }

  const task = await Task.create(req.body);

  res.status(201).json({
    success: true,
    data: task
  });
});

// @desc    Update task
// @route   PUT /api/v1/tasks/:id
// @access  Private/Employer
exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);

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

  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Delete task
// @route   DELETE /api/v1/tasks/:id
// @access  Private/Employer
exports.deleteTask = asyncHandler(async (req, res, next) => {
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
        `User ${req.user.id} is not authorized to delete this task`,
        403
      )
    );
  }

  await task.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Assign tasker to a task
// @route   PUT /api/v1/tasks/:id/assign
// @access  Private/Employer
exports.assignTasker = asyncHandler(async (req, res, next) => {
  const { taskerId } = req.body;

  if (!taskerId) {
    return next(new ErrorResponse('Please provide a tasker ID', 400));
  }

  let task = await Task.findById(req.params.id);

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

  // Check if tasker exists
  const tasker = await User.findById(taskerId);

  if (!tasker) {
    return next(
      new ErrorResponse(`Tasker not found with id of ${taskerId}`, 404)
    );
  }

  // Check if user is a tasker
  if (tasker.role !== 'tasker') {
    return next(
      new ErrorResponse(`User with ID ${taskerId} is not a tasker`, 400)
    );
  }

  // Update task with tasker and status
  task = await Task.findByIdAndUpdate(
    req.params.id,
    {
      tasker: taskerId,
      status: 'assigned',
      startDate: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Mark task as in-progress
// @route   PUT /api/v1/tasks/:id/progress
// @access  Private/Tasker
exports.startTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is assigned tasker
  if (
    (!task.tasker || task.tasker.toString() !== req.user.id) &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this task`,
        403
      )
    );
  }

  // Check if task is in correct status
  if (task.status !== 'assigned') {
    return next(
      new ErrorResponse(
        `Task cannot be started. Current status: ${task.status}`,
        400
      )
    );
  }

  // Update task status
  task = await Task.findByIdAndUpdate(
    req.params.id,
    {
      status: 'in-progress'
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Mark task as completed
// @route   PUT /api/v1/tasks/:id/complete
// @access  Private/Tasker
exports.completeTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is assigned tasker
  if (
    (!task.tasker || task.tasker.toString() !== req.user.id) &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this task`,
        403
      )
    );
  }

  // Check if task is in correct status
  if (task.status !== 'in-progress') {
    return next(
      new ErrorResponse(
        `Task cannot be completed. Current status: ${task.status}`,
        400
      )
    );
  }

  // Update task status
  task = await Task.findByIdAndUpdate(
    req.params.id,
    {
      status: 'completed',
      completionDate: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Get tasks for current user (employer or tasker)
// @route   GET /api/v1/tasks/my-tasks
// @access  Private
exports.getMyTasks = asyncHandler(async (req, res, next) => {
  let query;

  if (req.user.role === 'employer') {
    query = Task.find({ employer: req.user.id });
  } else if (req.user.role === 'tasker') {
    query = Task.find({ tasker: req.user.id });
  } else {
    return next(
      new ErrorResponse(
        `User role ${req.user.role} cannot have tasks`,
        403
      )
    );
  }

  // Add filtering and pagination similar to getTasks
  query = query
    .populate({
      path: 'employer',
      select: 'name location'
    })
    .populate({
      path: 'tasker',
      select: 'name location averageRating'
    })
    .populate('requiredSkills')
    .sort('-createdAt');

  const tasks = await query;

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});