const Comment = require('../models/Comment');
const Video = require('../models/Video');

// GET /api/comments/:videoId
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ video: req.params.videoId }).sort({ createdAt: -1 });
    res.json({ comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/comments/:videoId
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const comment = await Comment.create({
      video: req.params.videoId,
      user: req.user._id,
      username: req.user.username,
      text: text.trim(),
    });

    await Video.findByIdAndUpdate(req.params.videoId, { $inc: { commentCount: 1 } });
    res.status(201).json({ comment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
