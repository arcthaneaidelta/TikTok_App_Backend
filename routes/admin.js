const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getAllUsers,
  getPendingCreators,
  approveCreator,
  rejectCreator,
  getAllVideos,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require Super Admin
router.use(protect, authorize('superAdmin'));

router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.get('/pending', getPendingCreators);
router.get('/videos', getAllVideos);
router.put('/approve/:id', approveCreator);
router.put('/reject/:id', rejectCreator);

module.exports = router;
