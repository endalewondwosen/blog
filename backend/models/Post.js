import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: String,
  authorAvatar: String,
  createdAt: { type: Number, default: () => Date.now() }
});

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    default: '' // Content is now optional for drafts
  },
  excerpt: {
    type: String
  },
  coverUrl: {
    type: String
  },
  audioUrl: {
    type: String, // Store Base64 Data URI or URL
    default: null
  },
  tags: {
    type: [String],
    default: []
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: {
    type: [commentSchema],
    default: []
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: String,
  authorAvatar: String,
  readTimeMinutes: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Number, // Using timestamp for compatibility
    default: () => Date.now()
  }
});

postSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

postSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
  }
});

export default mongoose.model('Post', postSchema);