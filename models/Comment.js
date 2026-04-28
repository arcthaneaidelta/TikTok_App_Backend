const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

commentSchema.index({ video: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
