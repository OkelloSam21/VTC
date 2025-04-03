const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Connection = require('../models/Connection');
const User = require('../models/User');
const Task = require('../models/Task');

// @desc    Get all connections
// @route   GET /api/v1/connections
// @access  Private/Admin
exports.getConnections = asyncHandler(async (req, res, next) => {
  const connections = await Connection.find()
    .populate({
      path: 'employer',
      select: 'name phoneNumber location'
    })
    .populate({
      path: 'tasker',
      select: 'name phoneNumber location skills averageRating'
    })
    .populate('task');

  res.status(200).json({
    success: true,
    count: connections.length,
    data: connections
  });
});

// @desc    Get a specific connection
// @route   GET /api/v1/connections/:id
// @access  Private
exports.getConnection = asyncHandler(async (req, res, next) => {
  const connection = await Connection.findById(req.params.id)
    .populate({
      path: 'employer',
      select: 'name phoneNumber location'
    })
    .populate({
      path: 'tasker',
      select: 'name phoneNumber location skills averageRating'
    })
    .populate('task');

  if (!connection) {
    return next(
      new ErrorResponse(`Connection not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is connection employer or tasker
  if (
    connection.employer.toString() !== req.user.id &&
    connection.tasker.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this connection`,
        403
      )
    );
  }

  res.status(200).json({
    success: true,
    data: connection
  });
});

// @desc    Get user's connections
// @route   GET /api/v1/connections/my-connections
// @access  Private
exports.getMyConnections = asyncHandler(async (req, res, next) => {
  let query;

  if (req.user.role === 'employer') {
    query = Connection.find({ employer: req.user.id });
  } else if (req.user.role === 'tasker') {
    query = Connection.find({ tasker: req.user.id });
  } else {
    return next(
      new ErrorResponse(
        `User role ${req.user.role} cannot have connections`,
        403
      )
    );
  }

  const connections = await query
    .populate({
      path: 'employer',
      select: 'name phoneNumber location'
    })
    .populate({
      path: 'tasker',
      select: 'name phoneNumber location skills averageRating'
    })
    .populate('task')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: connections.length,
    data: connections
  });
});

// @desc    Create a connection
// @route   POST /api/v1/connections
// @access  Private
exports.createConnection = asyncHandler(async (req, res, next) => {
  const { taskerId, taskId } = req.body;

  // Check if task exists
  const task = await Task.findById(taskId);
  if (!task) {
    return next(new ErrorResponse(`Task not found with id of ${taskId}`, 404));
  }

  // Check if tasker exists
  const tasker = await User.findById(taskerId);
  if (!tasker) {
    return next(
      new ErrorResponse(`Tasker not found with id of ${taskerId}`, 404)
    );
  }

  // Check if user is employer and task owner
  if (req.user.role === 'employer') {
    if (task.employer.toString() !== req.user.id) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to create a connection for this task`,
          403
        )
      );
    }

    // Create connection
    const connection = await Connection.create({
      employer: req.user.id,
      tasker: taskerId,
      task: taskId,
      initiatedBy: 'employer'
    });

    return res.status(201).json({
      success: true,
      data: connection
    });
  }

  // Check if user is tasker and trying to connect
  if (req.user.role === 'tasker') {
    if (req.user.id !== taskerId) {
      return next(
        new ErrorResponse(
          `Tasker ${req.user.id} can only create connections for themselves`,
          403
        )
      );
    }

    // Create connection
    const connection = await Connection.create({
      employer: task.employer,
      tasker: req.user.id,
      task: taskId,
      initiatedBy: 'tasker'
    });

    return res.status(201).json({
      success: true,
      data: connection
    });
  }

  return next(
    new ErrorResponse(
      `User role ${req.user.role} cannot create connections`,
      403
    )
  );
});

// @desc    Accept a connection
// @route   PUT /api/v1/connections/:id/accept
// @access  Private
exports.acceptConnection = asyncHandler(async (req, res, next) => {
  let connection = await Connection.findById(req.params.id);

  if (!connection) {
    return next(
      new ErrorResponse(`Connection not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if connection is in pending state
  if (connection.status !== 'pending') {
    return next(
      new ErrorResponse(
        `Connection cannot be accepted. Current status: ${connection.status}`,
        400
      )
    );
  }

  // Check if user is the one who should accept
  if (connection.initiatedBy === 'employer') {
    // Tasker should accept
    if (connection.tasker.toString() !== req.user.id) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to accept this connection`,
          403
        )
      );
    }
  } else {
    // Employer should accept
    if (connection.employer.toString() !== req.user.id) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to accept this connection`,
          403
        )
      );
    }
  }

  // Update connection status
  connection = await Connection.findByIdAndUpdate(
    req.params.id,
    {
      status: 'accepted',
      startDate: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );

  // Update related task
  await Task.findByIdAndUpdate(connection.task, {
    status: 'assigned',
    tasker: connection.tasker
  });

  // Return updated connection
  connection = await Connection.findById(req.params.id)
    .populate({
      path: 'employer',
      select: 'name phoneNumber location'
    })
    .populate({
      path: 'tasker',
      select: 'name phoneNumber location skills averageRating'
    })
    .populate('task');

  res.status(200).json({
    success: true,
    data: connection
  });
});

// @desc    Reject a connection
// @route   PUT /api/v1/connections/:id/reject
// @access  Private
exports.rejectConnection = asyncHandler(async (req, res, next) => {
  let connection = await Connection.findById(req.params.id);

  if (!connection) {
    return next(
      new ErrorResponse(`Connection not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if connection is in pending state
  if (connection.status !== 'pending') {
    return next(
      new ErrorResponse(
        `Connection cannot be rejected. Current status: ${connection.status}`,
        400
      )
    );
  }

  // Check if user is involved in the connection
  if (
    connection.employer.toString() !== req.user.id &&
    connection.tasker.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to reject this connection`,
        403
      )
    );
  }

  // Update connection status
  connection = await Connection.findByIdAndUpdate(
    req.params.id,
    {
      status: 'rejected'
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: connection
  });
});

// @desc    Complete a connection
// @route   PUT /api/v1/connections/:id/complete
// @access  Private
exports.completeConnection = asyncHandler(async (req, res, next) => {
  let connection = await Connection.findById(req.params.id);

  if (!connection) {
    return next(
      new ErrorResponse(`Connection not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if connection is in accepted state
  if (connection.status !== 'accepted') {
    return next(
      new ErrorResponse(
        `Connection cannot be completed. Current status: ${connection.status}`,
        400
      )
    );
  }

  // Check if user is the employer (only employers can mark as complete)
  if (connection.employer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to complete this connection`,
        403
      )
    );
  }

  // Update connection status
  connection = await Connection.findByIdAndUpdate(
    req.params.id,
    {
      status: 'completed',
      endDate: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );

  // Update related task
  await Task.findByIdAndUpdate(connection.task, {
    status: 'completed',
    completionDate: Date.now()
  });

  res.status(200).json({
    success: true,
    data: connection
  });
});