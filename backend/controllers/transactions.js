const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Task = require('../models/Task');

// @desc    Get all transactions
// @route   GET /api/v1/transactions
// @access  Private/Admin
exports.getTransactions = asyncHandler(async (req, res, next) => {
  const transactions = await Transaction.find()
    .populate({
      path: 'from',
      select: 'name phoneNumber'
    })
    .populate({
      path: 'to',
      select: 'name phoneNumber'
    })
    .populate('task');

  res.status(200).json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});

// @desc    Get user's transactions
// @route   GET /api/v1/transactions/my-transactions
// @access  Private
exports.getMyTransactions = asyncHandler(async (req, res, next) => {
  const transactions = await Transaction.find({
    $or: [{ from: req.user.id }, { to: req.user.id }]
  })
    .populate({
      path: 'from',
      select: 'name phoneNumber'
    })
    .populate({
      path: 'to',
      select: 'name phoneNumber'
    })
    .populate('task')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});

// @desc    Add funds to wallet (deposit)
// @route   POST /api/v1/transactions/deposit
// @access  Private/Employer
exports.depositFunds = asyncHandler(async (req, res, next) => {
  const { amount, paymentReference } = req.body;

  if (!amount || amount <= 0) {
    return next(new ErrorResponse('Please provide a valid amount', 400));
  }

  // Create a deposit transaction
  const transaction = await Transaction.create({
    type: 'deposit',
    amount,
    status: 'completed', // In a real app, this would be 'pending' until confirmed
    from: req.user.id,
    paymentReference,
    paymentMethod: 'mpesa',
    description: 'Wallet deposit',
    completedAt: Date.now()
  });

  // Update user wallet
  const user = await User.findById(req.user.id);
  user.wallet.balance += amount;
  user.wallet.transactions.push(transaction._id);
  await user.save();

  res.status(201).json({
    success: true,
    data: transaction
  });
});

// @desc    Create a payment transaction for a task
// @route   POST /api/v1/transactions/payment
// @access  Private/Employer
exports.createPayment = asyncHandler(async (req, res, next) => {
  const { taskId, amount } = req.body;

  // Check if task exists
  const task = await Task.findById(taskId);
  if (!task) {
    return next(new ErrorResponse(`Task not found with id of ${taskId}`, 404));
  }

  // Check if user is the employer
  if (task.employer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to create payment for this task`,
        403
      )
    );
  }

  // Check if the task has an assigned tasker
  if (!task.tasker) {
    return next(
      new ErrorResponse(`Task does not have an assigned tasker`, 400)
    );
  }

  // Check wallet balance
  const user = await User.findById(req.user.id);
  if (user.wallet.balance < amount) {
    return next(
      new ErrorResponse(`Insufficient funds in wallet. Please deposit more funds.`, 400)
    );
  }

  // Create a payment transaction
  const transaction = await Transaction.create({
    type: 'payment',
    amount,
    status: 'pending', // Initially in escrow
    from: req.user.id,
    to: task.tasker,
    task: taskId,
    paymentMethod: 'wallet',
    description: `Payment for task: ${task.title}`
  });

  // Update user wallet
  user.wallet.balance -= amount;
  user.wallet.transactions.push(transaction._id);
  await user.save();

  // Update task payment info
  task.payment.amount = amount;
  task.payment.status = 'escrow';
  task.payment.transaction = transaction._id;
  await task.save();

  res.status(201).json({
    success: true,
    data: transaction
  });
});

// @desc    Release payment for a task
// @route   PUT /api/v1/transactions/:id/release
// @access  Private/Employer
exports.releasePayment = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(
      new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if transaction is a payment and in pending status
  if (transaction.type !== 'payment' || transaction.status !== 'pending') {
    return next(
      new ErrorResponse(
        `Transaction cannot be released. Type: ${transaction.type}, Status: ${transaction.status}`,
        400
      )
    );
  }

  // Check if user is the payer
  if (transaction.from.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to release this payment`,
        403
      )
    );
  }

  // Update transaction status
  transaction.status = 'completed';
  transaction.completedAt = Date.now();
  await transaction.save();

  // Update task payment status
  if (transaction.task) {
    const task = await Task.findById(transaction.task);
    if (task) {
      task.payment.status = 'released';
      await task.save();
    }
  }

  // Update recipient's wallet
  const recipient = await User.findById(transaction.to);
  if (recipient) {
    if (!recipient.wallet) {
      recipient.wallet = {
        balance: 0,
        transactions: []
      };
    }
    recipient.wallet.balance += transaction.amount;
    recipient.wallet.transactions.push(transaction._id);
    await recipient.save();
  }

  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc    Get wallet balance
// @route   GET /api/v1/transactions/wallet
// @access  Private
exports.getWalletBalance = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  const walletBalance = user.wallet ? user.wallet.balance : 0;

  res.status(200).json({
    success: true,
    data: {
      balance: walletBalance
    }
  });
});