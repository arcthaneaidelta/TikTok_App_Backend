const User = require('../models/User');
const Video = require('../models/Video');
const Comment = require('../models/Comment');

// GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const totalVideos = await Video.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalComments = await Comment.countDocuments();
    const pendingCount = await User.countDocuments({ role: 'contentCreator', status: 'pending' });

    const stats = await Video.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' },
          totalShares: { $sum: '$shares' },
        },
      },
    ]);

    const topVideos = await Video.find().sort({ views: -1 }).limit(5);

    res.json({
      analytics: {
        totalVideos,
        totalUsers,
        totalComments,
        pendingCount,
        totalViews: stats[0]?.totalViews || 0,
        totalLikes: stats[0]?.totalLikes || 0,
        totalShares: stats[0]?.totalShares || 0,
      },
      topVideos,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/pending
exports.getPendingCreators = async (req, res) => {
  try {
    const users = await User.find({ role: 'contentCreator', status: 'pending' });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/approve/:id
exports.approveCreator = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/reject/:id
exports.rejectCreator = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/videos?creator=&sortBy=
exports.getAllVideos = async (req, res) => {
  try {
    const { creator, sortBy } = req.query;
    let query = {};
    if (creator) {
      query.creatorUsername = { $regex: creator, $options: 'i' };
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'views') sort = { views: -1 };
    if (sortBy === 'likes') sort = { likes: -1 };

    const videos = await Video.find(query).sort(sort);
    res.json({ videos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
