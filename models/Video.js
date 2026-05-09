const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    storageKey: { type: String, default: null },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    creatorUsername: { type: String, required: true },
    musicName: { type: String, default: null },
    durationSeconds: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

videoSchema.index({ createdAt: -1 });
videoSchema.index({ creator: 1 });

module.exports = mongoose.model('Video', videoSchema);
