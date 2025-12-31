import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  avatarUrl: {
    type: String,
    default: 'https://picsum.photos/100/100'
  },
  bio: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  bookmarks: {
    type: [String], // Array of Post IDs
    default: []
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

// Map _id to id for frontend compatibility
userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    delete ret.password; // Never expose password
  }
});

export default mongoose.model('User', userSchema);