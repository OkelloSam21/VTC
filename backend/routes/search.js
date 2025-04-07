const express = require('express');
const {
  searchTasks,
  searchTaskers
} = require('../controllers/search');

const router = express.Router();

router.get('/tasks', searchTasks);
router.get('/taskers', searchTaskers);

module.exports = router;