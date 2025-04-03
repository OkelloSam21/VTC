const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Load models
const Skill = require('../models/Skill');
const Location = require('../models/Location');

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Read JSON files
const skills = JSON.parse(
  fs.readFileSync(`${__dirname}/data/skills.json`, 'utf-8')
);

const locations = JSON.parse(
  fs.readFileSync(`${__dirname}/data/locations.json`, 'utf-8')
);

// Import into DB
const importData = async () => {
  try {
    await Skill.create(skills);
    await Location.create(locations);
    
    console.log('Data Imported...'.green.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await Skill.deleteMany();
    await Location.deleteMany();
    
    console.log('Data Destroyed...'.red.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
}