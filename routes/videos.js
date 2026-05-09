const express = require('express');
const router = express.Router();
const {
  getFeed,
  getByCreator,
  uploadVideo,
  incrementView,
  toggleLike,
  incrementShare,
  deleteVideo,
  getLikedVideos,
} = require('../controllers/videoController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/storage');

router.get('/feed', getFeed);
router.get('/liked', protect, getLikedVideos);
router.get('/creator/:creatorId', getByCreator);

router.post(
  '/upload',
  protect,
  authorize('contentCreator', 'superAdmin'),
  upload.single('video'),
  uploadVideo
);

router.put('/:id/view', incrementView);
router.put('/:id/like', protect, toggleLike);
router.put('/:id/share', incrementShare);
router.delete('/:id', protect, deleteVideo);

module.exports = router;
