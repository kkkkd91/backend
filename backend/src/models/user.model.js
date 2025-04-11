const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values and still enforce uniqueness
    },
    linkedinId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values and still enforce uniqueness
    },
    mobileNumber: {
      type: String,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: {
      type: String,
      select: false, // Don't return by default
    },
    emailVerificationExpires: {
      type: Date,
      select: false, // Don't return by default
    },
    onboardingStatus: {
      type: String,
      enum: ['incomplete', 'completed'],
      default: 'incomplete',
    },
    onboardingStep: {
      type: Number,
      default: 1,
    },
    onboardingData: {
      workspaceType: {
        type: String,
        enum: ['team', 'individual', null],
        default: null,
      },
      preferredTheme: {
        type: String,
        enum: ['light', 'dark', null],
        default: null,
      },
      postStyle: {
        type: String,
        enum: ['standard', 'formatted', 'chunky', 'short', 'emojis', null],
        default: null,
      },
      postFrequency: {
        type: Number,
        default: null,
      },
      language: {
        type: String,
        enum: ['english', 'german', null],
        default: null,
      },
      websiteLink: {
        type: String,
        default: '',
      },
      inspirationProfiles: {
        type: [String],
        default: [],
      },
    },
    resetPasswordToken: {
      type: String,
      select: false, // Don't return by default
    },
    resetPasswordExpires: {
      type: Date,
      select: false, // Don't return by default
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get full name
userSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

module.exports = User; 