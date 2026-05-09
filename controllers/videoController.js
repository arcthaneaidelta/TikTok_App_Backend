const Video = require('../models/Video');
const User = require('../models/User');
const {
  buildPublicUrl,
  buildThumbUrl,
  removeStoredFile,
  removeStoredThumb,
  generateThumbnail,
} = require('../config/storage');

// GET /api/videos/feed
exports.getFeed = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 }).limit(50);
    res.json({ videos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/videos/creator/:creatorId
exports.getByCreator = async (req, res) => {
  try {
    const videos = await Video.find({ creator: req.params.creatorId }).sort({ createdAt: -1 });
    res.json({ videos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/videos/upload  (multipart/form-data with field "video")
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const { title, musicName, durationSeconds } = req.body;
    if (!title) {
      removeStoredFile(req.file.filename);
      return res.status(400).json({ message: 'Title is required' });
    }

    const duration = Number(durationSeconds) || 0;
    if (duration > 60.5) {
      removeStoredFile(req.file.filename);
      return res.status(400).json({ message: 'Video exceeds 60 seconds limit' });
    }

    const thumbFilename = await generateThumbnail(req.file.filename);

    const video = await Video.create({
      title,
      videoUrl: buildPublicUrl(req, req.file.filename),
      thumbnailUrl: thumbFilename ? buildThumbUrl(req, thumbFilename) : '',
      storageKey: req.file.filename,
      thumbStorageKey: thumbFilename,
      creator: req.user._id,
      creatorUsername: req.user.username,
      musicName: musicName || null,
      durationSeconds: duration,
    });

    res.status(201).json({ video });
  } catch (error) {
    if (req.file) removeStoredFile(req.file.filename);
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/videos/:id/view
exports.incrementView = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json({ video });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/videos/:id/like
exports.toggleLike = async (req, res) => {
  try {
    const videoId = req.params.id;
    const user = await User.findById(req.user._id);
    const liked = user.likedVideoIds.some((id) => id.toString() === videoId);

    if (liked) {
      user.likedVideoIds = user.likedVideoIds.filter((id) => id.toString() !== videoId);
      await Video.findByIdAndUpdate(videoId, { $inc: { likes: -1 } });
    } else {
      user.likedVideoIds.push(videoId);
      await Video.findByIdAndUpdate(videoId, { $inc: { likes: 1 } });
    }
    await user.save();

    const video = await Video.findById(videoId);
    res.json({ video, liked: !liked });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/videos/:id/share
exports.incrementShare = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { shares: 1 } },
      { new: true }
    );
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json({ video });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/videos/:id  (Admin or owner)
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    // Owner or admin
    if (
      req.user.role !== 'superAdmin' &&
      video.creator.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (video.storageKey) removeStoredFile(video.storageKey);
    if (video.thumbStorageKey) removeStoredThumb(video.thumbStorageKey);
    await video.deleteOne();
    res.json({ message: 'Video deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/videos/liked  (current user's liked videos)
exports.getLikedVideos = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('likedVideoIds');
    res.json({ videos: user.likedVideoIds });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
