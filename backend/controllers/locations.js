const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Location = require('../models/Location');

// @desc    Get all counties
// @route   GET /api/v1/locations/counties
// @access  Public
exports.getCounties = asyncHandler(async (req, res, next) => {
  const locations = await Location.find().select('county');
  
  const counties = locations.map(location => location.county);

  res.status(200).json({
    success: true,
    count: counties.length,
    data: counties
  });
});

// @desc    Get subcounties by county
// @route   GET /api/v1/locations/county/:county/subcounties
// @access  Public
exports.getSubCounties = asyncHandler(async (req, res, next) => {
  const location = await Location.findOne({ county: req.params.county });

  if (!location) {
    return next(
      new ErrorResponse(`County not found with name ${req.params.county}`, 404)
    );
  }

  const subCounties = location.subCounties.map(sc => sc.name);

  res.status(200).json({
    success: true,
    count: subCounties.length,
    data: subCounties
  });
});

// @desc    Get villages by county and subcounty
// @route   GET /api/v1/locations/county/:county/subcounty/:subcounty/villages
// @access  Public
exports.getVillages = asyncHandler(async (req, res, next) => {
  const location = await Location.findOne({ county: req.params.county });

  if (!location) {
    return next(
      new ErrorResponse(`County not found with name ${req.params.county}`, 404)
    );
  }

  const subCounty = location.subCounties.find(
    sc => sc.name === req.params.subcounty
  );

  if (!subCounty) {
    return next(
      new ErrorResponse(
        `Subcounty not found with name ${req.params.subcounty}`,
        404
      )
    );
  }

  const villages = subCounty.villages.map(village => village.name);

  res.status(200).json({
    success: true,
    count: villages.length,
    data: villages
  });
});

// @desc    Create a location (county, subcounties, villages)
// @route   POST /api/v1/locations
// @access  Private/Admin
exports.createLocation = asyncHandler(async (req, res, next) => {
  const location = await Location.create(req.body);

  res.status(201).json({
    success: true,
    data: location
  });
});