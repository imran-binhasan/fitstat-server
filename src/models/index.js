const mongoose = require('mongoose');

// Class Model
const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    maxlength: [100, 'Class name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Class description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  image: {
    type: String,
    required: [true, 'Class image is required']
  },
  price: {
    type: Number,
    required: [true, 'Class price is required'],
    min: [0, 'Price cannot be negative']
  },
  duration: {
    type: Number,
    required: [true, 'Class duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: [true, 'Difficulty level is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  bookingCount: {
    type: Number,
    default: 0,
    min: [0, 'Booking count cannot be negative']
  },
  maxCapacity: {
    type: Number,
    default: 20,
    min: [1, 'Max capacity must be at least 1']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

classSchema.index({ name: 'text', description: 'text' });
classSchema.index({ category: 1 });
classSchema.index({ difficulty: 1 });
classSchema.index({ bookingCount: -1 });

// Forum Model
const forumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Forum title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Forum content is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  author: {
    name: {
      type: String,
      required: [true, 'Author name is required']
    },
    email: {
      type: String,
      required: [true, 'Author email is required']
    },
    avatar: String
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  voteCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

forumSchema.index({ title: 'text', content: 'text' });
forumSchema.index({ category: 1 });
forumSchema.index({ voteCount: -1 });
forumSchema.index({ createdAt: -1 });

// Newsletter Subscriber Model
const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  name: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    topics: [{
      type: String,
      enum: ['fitness', 'nutrition', 'wellness', 'classes', 'events']
    }],
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    }
  }
}, {
  timestamps: true
});

// Payment Model
const paymentSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: [true, 'User email is required'],
    lowercase: true
  },
  userName: {
    type: String,
    required: [true, 'User name is required']
  },
  trainerName: {
    type: String,
    required: [true, 'Trainer name is required']
  },
  trainerEmail: {
    type: String,
    required: [true, 'Trainer email is required']
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required']
  },
  packageName: {
    type: String,
    required: [true, 'Package name is required']
  },
  packagePrice: {
    type: Number,
    required: [true, 'Package price is required'],
    min: [0, 'Price cannot be negative']
  },
  slotName: {
    type: String,
    required: [true, 'Slot name is required']
  },
  paymentIntentId: {
    type: String,
    required: [true, 'Payment intent ID is required']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  paymentMethod: {
    type: String,
    default: 'card'
  },
  currency: {
    type: String,
    default: 'usd'
  }
}, {
  timestamps: true
});

paymentSchema.index({ userEmail: 1 });
paymentSchema.index({ classId: 1 });
paymentSchema.index({ paymentStatus: 1 });

// Review Model
const reviewSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: [true, 'User email is required'],
    lowercase: true
  },
  userName: {
    type: String,
    required: [true, 'User name is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  trainerEmail: String,
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

reviewSchema.index({ userEmail: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });

// Create models
const Class = mongoose.model('Class', classSchema);
const Forum = mongoose.model('Forum', forumSchema);
const Subscriber = mongoose.model('Subscriber', subscriberSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const Review = mongoose.model('Review', reviewSchema);

module.exports = {
  Class,
  Forum,
  Subscriber,
  Payment,
  Review
};