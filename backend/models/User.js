const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['tasker', 'employer'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nationalId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  location: {
    county: {
      type: String,
      required: true,
      trim: true
    },
    subCounty: {
      type: String,
      required: true,
      trim: true
    },
    village: {
      type: String,
      required: true,
      trim: true
    }
  },
  // Fields specific to taskers
  education: {
    highestLevel: {
      type: String,
      enum: ['primary', 'secondary', 'college/university'],
      default: 'primary'
    },
    specialization: {
      type: String,
      trim: true,
      default: ''
    }
  },
  skills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  availability: {
    type: Boolean,
    default: true
  },
  // User authentication
  password: {
    type: String,
    required: true,
    select: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  // Wallet for employers
  wallet: {
    balance: {
      type: Number,
      default: 0
    },
    transactions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }]
  },
  // Ratings and reviews
  averageRating: {
    type: Number,
    default: 0
  },
  // Task history
  taskHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);