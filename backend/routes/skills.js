const express = require('express');
const {
  getSkills,
  getSkillsByCategory,
  createSkill,
  updateSkill,
  deleteSkill
} = require('../controllers/skills');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(getSkills)
  .post(protect, authorize('admin'), createSkill);

router.route('/category/:category').get(getSkillsByCategory);

router
  .route('/:id')
  .put(protect, authorize('admin'), updateSkill)
  .delete(protect, authorize('admin'), deleteSkill);

module.exports = router;