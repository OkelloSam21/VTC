const express = require('express');
const {
  uploadProfilePicture,
  uploadTaskImage
} = require('../controllers/upload');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.put('/profile', protect, uploadProfilePicture);
router.put('/task/:id', protect, uploadTaskImage);

module.exports = router;