const mongoose = require('mongoose');

const VillageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  }
});

const SubCountySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  villages: [VillageSchema]
});

const LocationSchema = new mongoose.Schema({
  county: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  subCounties: [SubCountySchema]
});

module.exports = mongoose.model('Location', LocationSchema);