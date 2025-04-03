const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  assignTasker,
  startTask,
  completeTask,
  getMyTasks
} = require('../controllers/tasks');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(getTasks)
  .post(protect, authorize('employer'), createTask);

router.route('/my-tasks').get(protect, getMyTasks);

router
  .route('/:id')
  .get(getTask)
  .put(protect, authorize('employer'), updateTask)
  .delete(protect, authorize('employer'), deleteTask);

router
  .route('/:id/assign')
  .put(protect, authorize('employer'), assignTasker);

router
  .route('/:id/progress')
  .put(protect, authorize('tasker'), startTask);

router
  .route('/:id/complete')
  .put(protect, authorize('tasker'), completeTask);

module.exports = router;