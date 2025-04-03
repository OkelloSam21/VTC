const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Skill = require('../models/Skill');

// @desc    Get all skills
// @route   GET /api/v1/skills
// @access  Public
exports.getSkills = asyncHandler(async (req, res, next) => {
  const skills = await Skill.find().sort('category name');

  res.status(200).json({
    success: true,
    count: skills.length,
    data: skills
  });
});

// @desc    Get skills by category
// @route   GET /api/v1/skills/category/:category
// @access  Public
exports.getSkillsByCategory = asyncHandler(async (req, res, next) => {
  const skills = await Skill.find({ category: req.params.category }).sort('name');

  res.status(200).json({
    success: true,
    count: skills.length,
    data: skills
  });
});

// @desc    Create new skill
// @route   POST /api/v1/skills
// @access  Private/Admin
exports.createSkill = asyncHandler(async (req, res, next) => {
  const skill = await Skill.create(req.body);

  res.status(201).json({
    success: true,
    data: skill
  });
});

// @desc    Update skill
// @route   PUT /api/v1/skills/:id
// @access  Private/Admin
exports.updateSkill = asyncHandler(async (req, res, next) => {
  let skill = await Skill.findById(req.params.id);

  if (!skill) {
    return next(
      new ErrorResponse(`Skill not found with id of ${req.params.id}`, 404)
    );
  }

  skill = await Skill.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: skill
  });
});

// @desc    Delete skill
// @route   DELETE /api/v1/skills/:id
// @access  Private/Admin
exports.deleteSkill = asyncHandler(async (req, res, next) => {
  const skill = await Skill.findById(req.params.id);

  if (!skill) {
    return next(
      new ErrorResponse(`Skill not found with id of ${req.params.id}`, 404)
    );
  }

  await skill.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});