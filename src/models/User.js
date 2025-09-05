const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const socialLinksSchema = new mongoose.Schema({
  facebook: { type: String, default: '' },
  twitter: { type: String, default: '' },
  instagram: { type: String, default: '' },
  linkedin: { type: String, default: '' }
}, { _id: false });

const slotSchema = new mongoose.Schema({
  selectedClasses: [{
    label: { type: String, required: true },
    value: { type: String, required: true }
  }],
  slotName: { type: String, required: true },
  slotTime: { type: String, required: true },
  slotDay: { type: String, required: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters long']
  },
  photoURL: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['member', 'trainer', 'admin'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'rejected', 'inactive'],
    default: 'active'
  },
  age: {
    type: Number,
    min: [13, 'Age must be at least 13'],
    max: [100, 'Age cannot exceed 100']
  },
  skills: [{
    type: String,
    trim: true
  }],
  availableDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  hoursPerDay: {
    type: Number,
    min: [1, 'Hours per day must be at least 1'],
    max: [24, 'Hours per day cannot exceed 24']
  },
  experience: {
    type: Number,
    min: [0, 'Experience cannot be negative']
  },
  socialLinks: socialLinksSchema,
  biodata: {
    type: String,
    maxlength: [1000, 'Biodata cannot exceed 1000 characters']
  },
  slots: [slotSchema],
  feedback: {
    type: String,
    maxlength: [500, 'Feedback cannot exceed 500 characters']
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'slots.selectedClasses.label': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (exclude sensitive data)
userSchema.methods.getPublicProfile = function() {
  const publicProfile = this.toObject();
  delete publicProfile.password;
  delete publicProfile.feedback;
  return publicProfile;
};

// Static method to find trainers
userSchema.statics.findTrainers = function(limit = null) {
  const query = this.find({ role: 'trainer', status: 'active' });
  return limit ? query.limit(limit) : query;
};

// Static method to find pending applications
userSchema.statics.findPendingApplications = function() {
  return this.find({ status: 'pending' }).select('name email createdAt');
};

module.exports = mongoose.model('User', userSchema);